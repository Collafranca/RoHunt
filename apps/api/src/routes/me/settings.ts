import { Hono } from "hono";

import { ApiError } from "../../middleware/errors";
import { deleteSessionByToken } from "../../repositories/auth/sessions";
import {
  deleteSettingsByUserId,
  getSettingsByUserId,
  updateSettingsByUserId,
  type MeSettings,
} from "../../repositories/me/settings";
import { requireAuthSessionContext } from "../../services/auth/session";

type MeSettingsUpdateBody = {
  readonly jobAlertsEnabled?: unknown;
  readonly visibility?: unknown;
};

export const meSettingsRoute = new Hono();

function parseSettingsUpdate(body: unknown): { readonly jobAlertsEnabled?: boolean; readonly visibility?: MeSettings["visibility"] } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid settings update body");
  }

  const normalized = body as MeSettingsUpdateBody;

  const parsed: {
    jobAlertsEnabled?: boolean;
    visibility?: MeSettings["visibility"];
  } = {};

  if (typeof normalized.jobAlertsEnabled === "boolean") {
    parsed.jobAlertsEnabled = normalized.jobAlertsEnabled;
  }

  if (normalized.visibility === "public" || normalized.visibility === "private") {
    parsed.visibility = normalized.visibility;
  } else if (normalized.visibility !== undefined) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'visibility' body parameter");
  }

  return parsed;
}

meSettingsRoute.get("/settings", (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const settings = getSettingsByUserId(auth.user.id);

  return c.json({
    data: {
      settings,
    },
  });
});

meSettingsRoute.put("/settings", async (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const input = parseSettingsUpdate(await c.req.json());
  const settings = updateSettingsByUserId(auth.user.id, input);

  return c.json({
    data: {
      settings,
    },
  });
});

meSettingsRoute.delete("/settings/account", (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));

  deleteSettingsByUserId(auth.user.id);
  deleteSessionByToken(auth.session.token);

  return c.json({
    data: {
      ok: true,
    },
  });
});
