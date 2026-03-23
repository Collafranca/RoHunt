import { createHmac, timingSafeEqual } from "node:crypto";

import { ApiError } from "../../middleware/errors";
import { getInternalServiceCredential } from "../../repositories/internal/service-credentials";

type VerifyInternalSignatureInput = {
  readonly serviceId: string;
  readonly timestamp: string;
  readonly nonce: string;
  readonly signature: string;
  readonly method: string;
  readonly path: string;
  readonly body: string;
};

const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;

function createSigningPayload(input: Omit<VerifyInternalSignatureInput, "signature">): string {
  return `${input.method.toUpperCase()}\n${input.path}\n${input.timestamp}\n${input.nonce}\n${input.body}`;
}

function assertTimestampIsFresh(timestamp: string): void {
  const parsedTimestamp = Number(timestamp);

  if (!Number.isFinite(parsedTimestamp)) {
    throw new ApiError(401, "UNAUTHORIZED", "Stale internal request timestamp");
  }

  if (Math.abs(Date.now() - parsedTimestamp) > MAX_TIMESTAMP_SKEW_MS) {
    throw new ApiError(401, "UNAUTHORIZED", "Stale internal request timestamp");
  }
}

function signaturesMatch(expectedSignature: string, providedSignature: string): boolean {
  const expected = Buffer.from(expectedSignature);
  const provided = Buffer.from(providedSignature);

  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(expected, provided);
}

export type VerifiedInternalService = {
  readonly serviceId: string;
  readonly scopes: readonly string[];
};

export function verifyInternalSignature(input: VerifyInternalSignatureInput): VerifiedInternalService {
  const credential = getInternalServiceCredential(input.serviceId);

  if (!credential) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  assertTimestampIsFresh(input.timestamp);

  const payload = createSigningPayload({
    serviceId: input.serviceId,
    timestamp: input.timestamp,
    nonce: input.nonce,
    method: input.method,
    path: input.path,
    body: input.body,
  });

  const expectedSignature = createHmac("sha256", credential.secret).update(payload).digest("hex");

  if (!signaturesMatch(expectedSignature, input.signature)) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid internal request signature");
  }

  return {
    serviceId: credential.serviceId,
    scopes: credential.scopes,
  };
}
