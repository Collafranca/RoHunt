import type { MiddlewareHandler } from "hono";

import { ApiError } from "./errors";
import { hasSeenInternalNonce, recordInternalNonce } from "../repositories/internal/nonce-store";
import { verifyInternalSignature } from "../services/internal/signature-verifier";

const INTERNAL_ROUTE_SCOPE_MAP: ReadonlyArray<{
  readonly path: string;
  readonly method: string;
  readonly scope: string;
}> = [
  { path: "/v1/internal/ingest/jobs", method: "POST", scope: "internal:ingest:jobs" },
  { path: "/v1/internal/notify/dispatch", method: "POST", scope: "internal:notify:dispatch" },
  { path: "/v1/internal/checks/lookup", method: "POST", scope: "internal:checks:lookup" },
];

function getRequiredScope(path: string, method: string): string | null {
  const route = INTERNAL_ROUTE_SCOPE_MAP.find((entry) => entry.path === path && entry.method === method.toUpperCase());
  return route?.scope ?? null;
}

function readRequiredHeader(value: string | undefined): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  return normalized;
}

export const authInternalMiddleware: MiddlewareHandler = async (c, next) => {
  const serviceId = readRequiredHeader(c.req.header("x-internal-service"));
  const timestamp = readRequiredHeader(c.req.header("x-internal-timestamp"));
  const nonce = readRequiredHeader(c.req.header("x-internal-nonce"));
  const signature = readRequiredHeader(c.req.header("x-internal-signature"));

  if (hasSeenInternalNonce(serviceId, nonce)) {
    throw new ApiError(401, "UNAUTHORIZED", "Replay nonce detected");
  }

  const body = await c.req.text();
  const verification = verifyInternalSignature({
    serviceId,
    timestamp,
    nonce,
    signature,
    method: c.req.method,
    path: c.req.path,
    body,
  });

  const requiredScope = getRequiredScope(c.req.path, c.req.method);

  if (requiredScope && !verification.scopes.includes(requiredScope)) {
    throw new ApiError(403, "FORBIDDEN", "Insufficient internal scope");
  }

  recordInternalNonce(serviceId, nonce);

  await next();
};
