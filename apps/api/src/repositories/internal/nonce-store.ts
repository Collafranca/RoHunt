const NONCE_TTL_MS = 5 * 60 * 1000;
const MAX_NONCE_ENTRIES = 10_000;

type NonceEntry = {
  recordedAt: number;
  state: "reserved" | "consumed";
};

const seenNonces = new Map<string, NonceEntry>();

function toNonceKey(serviceId: string, nonce: string): string {
  return `${serviceId}:${nonce}`;
}

function pruneExpiredNonces(now: number): void {
  for (const [key, entry] of seenNonces.entries()) {
    if (now - entry.recordedAt > NONCE_TTL_MS) {
      seenNonces.delete(key);
    }
  }
}

function ensureCapacity(): void {
  while (seenNonces.size >= MAX_NONCE_ENTRIES) {
    const oldestKey = seenNonces.keys().next().value;

    if (oldestKey === undefined) {
      return;
    }

    seenNonces.delete(oldestKey);
  }
}

export function reserveInternalNonce(serviceId: string, nonce: string): boolean {
  const now = Date.now();
  pruneExpiredNonces(now);

  const key = toNonceKey(serviceId, nonce);

  if (seenNonces.has(key)) {
    return false;
  }

  ensureCapacity();
  seenNonces.set(key, { recordedAt: now, state: "reserved" });
  return true;
}

export function consumeInternalNonceReservation(serviceId: string, nonce: string): void {
  const now = Date.now();
  pruneExpiredNonces(now);

  const key = toNonceKey(serviceId, nonce);
  const existing = seenNonces.get(key);

  if (!existing) {
    return;
  }

  seenNonces.set(key, { recordedAt: now, state: "consumed" });
}

export function releaseInternalNonceReservation(serviceId: string, nonce: string): void {
  const now = Date.now();
  pruneExpiredNonces(now);

  const key = toNonceKey(serviceId, nonce);
  const existing = seenNonces.get(key);

  if (!existing || existing.state !== "reserved") {
    return;
  }

  seenNonces.delete(key);
}

export function clearInternalNonceStore(): void {
  seenNonces.clear();
}
