import { Hono } from "hono";

import { ApiError } from "../../middleware/errors";
import { deleteSessionsByUserId } from "../../repositories/auth/sessions";
import { deleteUserById } from "../../repositories/auth/users";
import { deleteBackgroundChecksByUserId } from "../../repositories/me/checks";
import { deleteNotificationRulesByUserId } from "../../repositories/me/notifications";
import { deletePortfolioReviewsByUserId } from "../../repositories/me/reviews";
import { deleteSavedJobsByUserId } from "../../repositories/me/saved-jobs";
import {
  deleteSettingsByUserId,
  getSettingsByUserId,
  updateSettingsByUserId,
  type MeSettings,
} from "../../repositories/me/settings";
import {
  buildClearedSessionCookie,
  requireAuthSessionContext,
} from "../../services/auth/session";

type MeSettingsUpdateBody = {
  readonly jobAlertsEnabled?: unknown;
  readonly visibility?: unknown;
};

export const meSettingsRoute = new Hono();

async function parseJsonBody(c: { req: { json: () => Promise<unknown> } }): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new ApiError(400, "INVALID_QUERY", "Invalid JSON body");
  }
}

function parseSettingsUpdate(body: unknown): {
  readonly jobAlertsEnabled?: boolean;
  readonly visibility?: MeSettings["visibility"];
} {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid settings update body");
  }

  const normalized = body as MeSettingsUpdateBody;

  for (const key of Object.keys(normalized)) {
    if (key !== "jobAlertsEnabled" && key !== "visibility") {
      throw new ApiError(400, "INVALID_QUERY", "Invalid settings update body");
    }
  }

  const parsed: {
    jobAlertsEnabled?: boolean;
    visibility?: MeSettings["visibility"];
  } = {};

  if (normalized.jobAlertsEnabled !== undefined) {
    if (typeof normalized.jobAlertsEnabled !== "boolean") {
      throw new ApiError(400, "INVALID_QUERY", "Invalid 'jobAlertsEnabled' body parameter");
    }

    parsed.jobAlertsEnabled = normalized.jobAlertsEnabled;
  }

  if (normalized.visibility !== undefined) {
    if (normalized.visibility !== "public" && normalized.visibility !== "private") {
      throw new ApiError(400, "INVALID_QUERY", "Invalid 'visibility' body parameter");
    }

    parsed.visibility = normalized.visibility;
  }

  if (parsed.jobAlertsEnabled === undefined && parsed.visibility === undefined) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid settings update body");
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
  const input = parseSettingsUpdate(await parseJsonBody(c));
  const settings = updateSettingsByUserId(auth.user.id, input);

  return c.json({
    data: {
      settings,
    },
  });
});

meSettingsRoute.delete("/settings/account", (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const userId = auth.user.id;

  deleteSettingsByUserId(userId);
  deleteSavedJobsByUserId(userId);
  deleteNotificationRulesByUserId(userId);
  deleteBackgroundChecksByUserId(userId);
  deletePortfolioReviewsByUserId(userId);
  deleteSessionsByUserId(userId);
  deleteUserById(userId);

  c.header("set-cookie", buildClearedSessionCookie());

  return c.json({
    data: {
      ok: true,
    },
  });
});
