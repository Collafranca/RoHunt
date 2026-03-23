import type { IdempotencyStore } from "../services/queues/idempotency";
import {
  DEFAULT_RETRY_POLICY,
  calculateBackoffDelay,
  type RetryPolicy,
} from "../services/queues/retry";

export type QueueMessage<TPayload> = {
  readonly idempotencyKey: string;
  readonly payload: TPayload;
};

export type QueueConsumerResult =
  | { readonly status: "processed"; readonly attempts: number }
  | { readonly status: "duplicate"; readonly attempts: 0 }
  | { readonly status: "failed"; readonly attempts: number };

type QueueLogger = {
  error(message: string, metadata: Record<string, unknown>): void;
};

type QueueConsumerDependencies<TPayload> = {
  readonly queueName: string;
  readonly idempotencyStore: IdempotencyStore;
  readonly process: (message: { payload: TPayload }) => Promise<unknown>;
  readonly retryPolicy?: RetryPolicy;
  readonly sleep?: (delayMs: number) => Promise<void>;
  readonly logger: QueueLogger;
};

function defaultSleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export function createQueueConsumer<TPayload>(
  dependencies: QueueConsumerDependencies<TPayload>,
): (message: QueueMessage<TPayload>) => Promise<QueueConsumerResult> {
  const retryPolicy = dependencies.retryPolicy ?? DEFAULT_RETRY_POLICY;
  const sleep = dependencies.sleep ?? defaultSleep;

  return async (message: QueueMessage<TPayload>): Promise<QueueConsumerResult> => {
    const claim = await dependencies.idempotencyStore.claim(message.idempotencyKey);

    if (claim === "duplicate") {
      return {
        status: "duplicate",
        attempts: 0,
      };
    }

    let attempts = 0;

    while (attempts <= retryPolicy.maxRetries) {
      attempts += 1;

      try {
        await dependencies.process({ payload: message.payload });
        break;
      } catch (error) {
        if (attempts > retryPolicy.maxRetries) {
          await dependencies.idempotencyStore.release(message.idempotencyKey);

          dependencies.logger.error("queue message permanently failed", {
            queue: dependencies.queueName,
            attempts,
            idempotencyKey: message.idempotencyKey,
            error,
          });

          return {
            status: "failed",
            attempts,
          };
        }

        const delayMs = calculateBackoffDelay(attempts, retryPolicy);
        await sleep(delayMs);
      }
    }

    try {
      await dependencies.idempotencyStore.markProcessed(message.idempotencyKey);

      return {
        status: "processed",
        attempts,
      };
    } catch (error) {
      dependencies.logger.error("queue idempotency finalization failed", {
        queue: dependencies.queueName,
        attempts,
        idempotencyKey: message.idempotencyKey,
        error,
      });

      return {
        status: "failed",
        attempts,
      };
    }
  };
}
