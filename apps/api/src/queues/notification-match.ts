import { createQueueConsumer } from "../workers/queue-consumer";

export function createNotificationMatchConsumer<TPayload>(dependencies: {
  readonly idempotencyStore: {
    claim(key: string): "acquired" | "duplicate" | Promise<"acquired" | "duplicate">;
    markProcessed(key: string): void | Promise<void>;
    release(key: string): void | Promise<void>;
  };
  readonly process: (message: { payload: TPayload }) => Promise<unknown>;
  readonly retryPolicy?: {
    readonly maxRetries: number;
    readonly baseDelayMs: number;
    readonly maxDelayMs: number;
  };
  readonly sleep?: (delayMs: number) => Promise<void>;
  readonly logger: {
    error(message: string, metadata: Record<string, unknown>): void;
  };
}) {
  return createQueueConsumer<TPayload>({
    queueName: "notification-match",
    idempotencyStore: dependencies.idempotencyStore,
    process: dependencies.process,
    retryPolicy: dependencies.retryPolicy,
    sleep: dependencies.sleep,
    logger: dependencies.logger,
  });
}
