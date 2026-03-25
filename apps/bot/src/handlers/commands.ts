import { postInternalChecksLookup } from "../../../../packages/contracts/src/generated/client";
import type { createInternalApiClient, InternalChecksLookupBody } from "../internal-api/client";

export type CommandHandlerDeps = {
  readonly internalApi: ReturnType<typeof createInternalApiClient>;
};

export type ChecksLookupPayload = InternalChecksLookupBody;

export type CommandHandlers = {
  readonly runInternalChecksLookup: (payload: ChecksLookupPayload) => Promise<Response>;
};

export async function runInternalChecksLookup(
  deps: CommandHandlerDeps,
  payload: ChecksLookupPayload
): Promise<Response> {
  return deps.internalApi.send({
    request: postInternalChecksLookup(),
    body: payload,
  });
}

export function registerCommandHandlers(deps: CommandHandlerDeps): CommandHandlers {
  return {
    runInternalChecksLookup: (payload) => runInternalChecksLookup(deps, payload),
  };
}
