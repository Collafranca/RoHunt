import { randomUUID } from "node:crypto";

import {
  postInternalChecksLookup,
  postInternalNotifyDispatch,
} from "../../../../packages/contracts/src/generated/client";
import { createInternalApiSigner } from "./signer";

export type InternalApiClientConfig = {
  readonly baseUrl: string;
  readonly serviceId: string;
  readonly secret: string;
  readonly fetch?: typeof globalThis.fetch;
  readonly now?: () => number;
  readonly createNonce?: () => string;
};

export type InternalNotifyDispatchBody = {
  readonly userId: string;
  readonly channel: string;
  readonly message: string;
};

export type InternalChecksLookupBody = {
  readonly userId: string;
  readonly targetUserId: string;
};

export type InternalApiOperationRequest =
  | ReturnType<typeof postInternalNotifyDispatch>
  | ReturnType<typeof postInternalChecksLookup>;

type InternalApiBodyByPath = {
  readonly "/v1/internal/notify/dispatch": InternalNotifyDispatchBody;
  readonly "/v1/internal/checks/lookup": InternalChecksLookupBody;
};

type BodyForOperation<TRequest extends InternalApiOperationRequest> =
  TRequest["path"] extends keyof InternalApiBodyByPath
    ? InternalApiBodyByPath[TRequest["path"]]
    : never;

export type SendInternalRequestInput<TRequest extends InternalApiOperationRequest = InternalApiOperationRequest> = {
  readonly request: TRequest;
  readonly body: BodyForOperation<TRequest>;
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
    async send<TRequest extends InternalApiOperationRequest>(
      input: SendInternalRequestInput<TRequest>
    ): Promise<Response> {
      const body = JSON.stringify(input.body);
      const nonce = createNonce();

      if (!input.request.path.startsWith("/v1/internal/")) {
        throw new Error(`Internal API client only supports /v1/internal/* operations: ${input.request.path}`);
      }

      const signedHeaders = signer.signRequest({
        method: input.request.method,
        path: input.request.path,
        nonce,
        body,
      });

      const headers = new Headers(signedHeaders);
      headers.set("content-type", "application/json");

      const url = new URL(input.request.path, config.baseUrl).toString();

      return fetchImpl(url, {
        method: input.request.method,
        headers,
        body,
      });
    },
  };
}
