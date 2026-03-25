import { randomUUID } from "node:crypto";

import { postInternalIngestJobs } from "../../../../packages/contracts/src/generated/client";
import type { IngestSubmitBody } from "../parsers/ingest";
import { createInternalApiSigner } from "./signer";

function assertSafeInternalPath(path: string): string {
  const lowerPath = path.toLowerCase();

  if (!path.startsWith("/v1/internal/")) {
    throw new Error(`Internal API client only supports /v1/internal/* operations: ${path}`);
  }

  if (path.includes("\\") || /%2f|%5c/.test(lowerPath)) {
    throw new Error(`Internal API client rejected unsafe path: ${path}`);
  }

  let decodedPath: string;

  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    throw new Error(`Internal API client rejected invalid path encoding: ${path}`);
  }

  const lowerDecodedPath = decodedPath.toLowerCase();

  if (decodedPath.includes("\\") || decodedPath.includes("//") || /%2e|%2f|%5c/.test(lowerDecodedPath)) {
    throw new Error(`Internal API client rejected unsafe path: ${path}`);
  }

  const segments = decodedPath.split("/");

  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error(`Internal API client rejected unsafe path traversal: ${path}`);
  }

  return decodedPath;
}

export type InternalApiClientConfig = {
  readonly baseUrl: string;
  readonly serviceId: string;
  readonly secret: string;
  readonly fetch?: typeof globalThis.fetch;
  readonly now?: () => number;
  readonly createNonce?: () => string;
};

export type InternalIngestRequest = ReturnType<typeof postInternalIngestJobs>;

export type SendInternalIngestInput = {
  readonly request: InternalIngestRequest;
  readonly body: IngestSubmitBody;
  readonly idempotencyKey: string;
};

export function createInternalApiClient(config: InternalApiClientConfig) {
  const fetchImpl = config.fetch ?? globalThis.fetch;
  const createNonce = config.createNonce ?? randomUUID;
  const signer = createInternalApiSigner({
    serviceId: config.serviceId,
    secret: config.secret,
    now: config.now,
  });

  return {
    async send(input: SendInternalIngestInput): Promise<Response> {
      const body = JSON.stringify(input.body);
      const nonce = createNonce();
      const safePath = assertSafeInternalPath(input.request.path);

      const signedHeaders = signer.signRequest({
        method: input.request.method,
        path: safePath,
        nonce,
        body,
      });

      const headers = new Headers(signedHeaders);
      headers.set("content-type", "application/json");
      headers.set("x-idempotency-key", input.idempotencyKey);

      const url = new URL(safePath, config.baseUrl).toString();

      return fetchImpl(url, {
        method: input.request.method,
        headers,
        body,
      });
    },
  };
}
