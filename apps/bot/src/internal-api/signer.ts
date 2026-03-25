import { createHmac } from "node:crypto";

export type InternalApiSignerConfig = {
  readonly serviceId: string;
  readonly secret: string;
  readonly now?: () => number;
};

export type SignRequestInput = {
  readonly method: string;
  readonly path: string;
  readonly nonce: string;
  readonly body?: string;
};

export type SignedRequestHeaders = Record<string, string>;

export function createInternalApiSigner(config: InternalApiSignerConfig) {
  const now = config.now ?? Date.now;

  return {
    signRequest(input: SignRequestInput): SignedRequestHeaders {
      const timestamp = String(now());
      const body = input.body ?? "";
      const canonical = `${input.method.toUpperCase()}\n${input.path}\n${timestamp}\n${input.nonce}\n${body}`;
      const signature = createHmac("sha256", config.secret).update(canonical).digest("hex");

      return {
        "x-internal-service": config.serviceId,
        "x-internal-timestamp": timestamp,
        "x-internal-nonce": input.nonce,
        "x-internal-signature": signature,
      };
    },
  };
}
