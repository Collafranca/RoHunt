const seenNonces = new Set<string>();

function toNonceKey(serviceId: string, nonce: string): string {
  return `${serviceId}:${nonce}`;
}

export function hasSeenInternalNonce(serviceId: string, nonce: string): boolean {
  return seenNonces.has(toNonceKey(serviceId, nonce));
}

export function recordInternalNonce(serviceId: string, nonce: string): void {
  seenNonces.add(toNonceKey(serviceId, nonce));
}

export function clearInternalNonceStore(): void {
  seenNonces.clear();
}
