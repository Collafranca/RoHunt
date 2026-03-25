import { postInternalNotifyDispatch } from "../../../../packages/contracts/src/generated/client";
import type { createInternalApiClient, InternalNotifyDispatchBody } from "../internal-api/client";

export type NotificationHandlerDeps = {
  readonly internalApi: ReturnType<typeof createInternalApiClient>;
};

export type NotifyDispatchPayload = InternalNotifyDispatchBody;

export type NotificationHandlers = {
  readonly dispatchInternalNotification: (payload: NotifyDispatchPayload) => Promise<Response>;
};

export async function dispatchInternalNotification(
  deps: NotificationHandlerDeps,
  payload: NotifyDispatchPayload
): Promise<Response> {
  return deps.internalApi.send({
    request: postInternalNotifyDispatch(),
    body: payload,
  });
}

export function registerNotificationHandlers(deps: NotificationHandlerDeps): NotificationHandlers {
  return {
    dispatchInternalNotification: (payload) => dispatchInternalNotification(deps, payload),
  };
}
