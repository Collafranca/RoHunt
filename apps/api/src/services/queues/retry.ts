export type RetryPolicy = {
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 5_000,
};

export function calculateBackoffDelay(attemptNumber: number, policy: RetryPolicy): number {
  const exponentialDelay = policy.baseDelayMs * 2 ** Math.max(0, attemptNumber - 1);

  return Math.min(exponentialDelay, policy.maxDelayMs);
}
