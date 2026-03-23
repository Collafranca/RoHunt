export type IdempotencyClaimResult = "acquired" | "duplicate";

export type IdempotencyStore = {
  claim(key: string): IdempotencyClaimResult | Promise<IdempotencyClaimResult>;
  markProcessed(key: string): void | Promise<void>;
  release(key: string): void | Promise<void>;
};

export function createInMemoryIdempotencyStore(): IdempotencyStore {
  const processedKeys = new Set<string>();
  const inProgressKeys = new Set<string>();

  return {
    claim(key: string): IdempotencyClaimResult {
      if (processedKeys.has(key) || inProgressKeys.has(key)) {
        return "duplicate";
      }

      inProgressKeys.add(key);
      return "acquired";
    },
    markProcessed(key: string): void {
      inProgressKeys.delete(key);
      processedKeys.add(key);
    },
    release(key: string): void {
      inProgressKeys.delete(key);
    },
  };
}

