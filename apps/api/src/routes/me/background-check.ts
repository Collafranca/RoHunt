import { Hono } from "hono";

import { ApiError } from "../../middleware/errors";
import { requireAuthSessionContext } from "../../services/auth/session";
import { listBackgroundCheckHistory, submitBackgroundCheck } from "../../services/me/checks";

export const meBackgroundCheckRoute = new Hono();

type BackgroundCheckBody = {
  readonly targetUserId?: unknown;
  readonly note?: unknown;
};

function parseBody(body: unknown): { readonly targetUserId: string; readonly note: string } {
  const normalized = body as BackgroundCheckBody;

  if (typeof normalized?.targetUserId !== "string" || normalized.targetUserId.trim().length === 0) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'targetUserId' body parameter");
  }

  if (typeof normalized?.note !== "string" || normalized.note.trim().length === 0) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'note' body parameter");
  }

  return {
    targetUserId: normalized.targetUserId.trim(),
    note: normalized.note.trim(),
  };
}

meBackgroundCheckRoute.get("/background-check", (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const items = listBackgroundCheckHistory(auth.user.id);

  return c.json({
    data: {
      items,
    },
  });
});

meBackgroundCheckRoute.post("/background-check", async (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const body = parseBody(await c.req.json());

  const check = submitBackgroundCheck({
    userId: auth.user.id,
    targetUserId: body.targetUserId,
    note: body.note,
  });

  return c.json({
    data: {
      check,
    },
  });
});
