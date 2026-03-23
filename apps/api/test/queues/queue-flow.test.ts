import { describe, expect, it, vi } from "vitest";

import { createInMemoryIdempotencyStore } from "../../src/services/queues/idempotency";
import { DEFAULT_RETRY_POLICY, calculateBackoffDelay } from "../../src/services/queues/retry";
import { createIngestParseConsumer } from "../../src/queues/ingest-parse";
import { createNotificationDeliveryConsumer } from "../../src/queues/notification-delivery";

describe("queue flow", () => {
  it("does not process a duplicate idempotency key twice", async () => {
    const process = vi.fn(async () => {
      return { ok: true };
    });

    const consumer = createIngestParseConsumer({
      idempotencyStore: createInMemoryIdempotencyStore(),
      process,
      logger: {
        error: vi.fn(),
      },
    });

    const message = {
      idempotencyKey: "ingest:key:1",
      payload: {
        raw: "discord-payload",
      },
    };

    const firstResult = await consumer(message);
    const secondResult = await consumer(message);

    expect(firstResult.status).toBe("processed");
    expect(secondResult.status).toBe("duplicate");
    expect(process).toHaveBeenCalledTimes(1);
  });

  it("treats concurrent same-key delivery as duplicate without double processing", async () => {
    const process = vi.fn(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      return { ok: true };
    });

    const consumer = createIngestParseConsumer({
      idempotencyStore: createInMemoryIdempotencyStore(),
      process,
      logger: {
        error: vi.fn(),
      },
    });

    const message = {
      idempotencyKey: "ingest:key:concurrent",
      payload: {
        raw: "discord-payload",
      },
    };

    const [resultA, resultB] = await Promise.all([consumer(message), consumer(message)]);

    const statuses = [resultA.status, resultB.status].sort();
    expect(statuses).toEqual(["duplicate", "processed"]);
    expect(process).toHaveBeenCalledTimes(1);
  });

  it("does not re-run process when finalization fails after success", async () => {
    const process = vi.fn(async () => {
      return { ok: true };
    });

    let claimSeen = false;
    const idempotencyStore = {
      claim: vi.fn(async (_key: string) => {
        if (claimSeen) {
          return "duplicate" as const;
        }

        claimSeen = true;
        return "acquired" as const;
      }),
      markProcessed: vi.fn(async () => {
        throw new Error("idempotency-store-unavailable");
      }),
      release: vi.fn(async () => undefined),
    };

    const logger = {
      error: vi.fn(),
    };

    const consumer = createIngestParseConsumer({
      idempotencyStore,
      process,
      logger,
    });

    const message = {
      idempotencyKey: "ingest:key:finalize-failure",
      payload: {
        raw: "discord-payload",
      },
    };

    const firstResult = await consumer(message);
    const secondResult = await consumer(message);

    expect(firstResult.status).toBe("failed");
    expect(secondResult.status).toBe("duplicate");
    expect(process).toHaveBeenCalledTimes(1);
    expect(idempotencyStore.markProcessed).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      "queue idempotency finalization failed",
      expect.objectContaining({
        idempotencyKey: "ingest:key:finalize-failure",
      }),
    );
  });

  it("retries with bounded exponential backoff before succeeding", async () => {
    const sleep = vi.fn(async (_delayMs: number) => undefined);
    const process = vi
      .fn<[{ payload: { jobId: string } }], Promise<{ ok: boolean }>>()
      .mockRejectedValueOnce(new Error("transient-1"))
      .mockRejectedValueOnce(new Error("transient-2"))
      .mockResolvedValue({ ok: true });

    const consumer = createIngestParseConsumer({
      idempotencyStore: createInMemoryIdempotencyStore(),
      process,
      sleep,
      retryPolicy: {
        maxRetries: 3,
        baseDelayMs: 25,
        maxDelayMs: 80,
      },
      logger: {
        error: vi.fn(),
      },
    });

    const result = await consumer({
      idempotencyKey: "ingest:key:2",
      payload: {
        jobId: "job-123",
      },
    });

    expect(result.status).toBe("processed");
    expect(process).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep.mock.calls.map(([delay]) => delay)).toEqual([
      calculateBackoffDelay(1, {
        maxRetries: 3,
        baseDelayMs: 25,
        maxDelayMs: 80,
      }),
      calculateBackoffDelay(2, {
        maxRetries: 3,
        baseDelayMs: 25,
        maxDelayMs: 80,
      }),
    ]);
  });

  it("logs permanent failures after max retries", async () => {
    const logger = {
      error: vi.fn(),
    };

    const process = vi.fn(async () => {
      throw new Error("downstream-down");
    });

    const consumer = createNotificationDeliveryConsumer({
      idempotencyStore: createInMemoryIdempotencyStore(),
      process,
      sleep: vi.fn(async (_delayMs: number) => undefined),
      retryPolicy: {
        ...DEFAULT_RETRY_POLICY,
        maxRetries: 2,
        baseDelayMs: 10,
        maxDelayMs: 50,
      },
      logger,
    });

    const result = await consumer({
      idempotencyKey: "delivery:key:1",
      payload: {
        notificationId: "notif-1",
      },
    });

    expect(result.status).toBe("failed");
    expect(process).toHaveBeenCalledTimes(3);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      "queue message permanently failed",
      expect.objectContaining({
        queue: "notification-delivery",
        attempts: 3,
        idempotencyKey: "delivery:key:1",
      }),
    );
  });
});
