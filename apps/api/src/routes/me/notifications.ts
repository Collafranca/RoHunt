import { Hono } from "hono";

import { ApiError } from "../../middleware/errors";
import {
  createNotificationRuleForUser,
  deleteNotificationRuleForUser,
  listNotificationRulesForUser,
  updateNotificationRuleForUser,
} from "../../services/me/notifications";
import { requireAuthSessionContext } from "../../services/auth/session";

export const meNotificationsRoute = new Hono();

type NotificationCreateBody = {
  readonly channel?: unknown;
  readonly keyword?: unknown;
};

type NotificationUpdateBody = {
  readonly keyword?: unknown;
  readonly enabled?: unknown;
};

function parseCreateBody(body: unknown): { readonly channel: string; readonly keyword: string } {
  const normalized = body as NotificationCreateBody;

  if (typeof normalized?.channel !== "string" || normalized.channel.trim().length === 0) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'channel' body parameter");
  }

  if (typeof normalized?.keyword !== "string" || normalized.keyword.trim().length === 0) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'keyword' body parameter");
  }

  return {
    channel: normalized.channel.trim(),
    keyword: normalized.keyword.trim(),
  };
}

function parseUpdateBody(body: unknown): { readonly keyword?: string; readonly enabled?: boolean } {
  const normalized = body as NotificationUpdateBody;

  if (typeof normalized !== "object" || normalized === null || Array.isArray(normalized)) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid notification update body");
  }

  const parsed: { keyword?: string; enabled?: boolean } = {};

  if (typeof normalized.keyword === "string") {
    if (normalized.keyword.trim().length === 0) {
      throw new ApiError(400, "INVALID_QUERY", "Invalid 'keyword' body parameter");
    }

    parsed.keyword = normalized.keyword.trim();
  }

  if (typeof normalized.enabled === "boolean") {
    parsed.enabled = normalized.enabled;
  }

  return parsed;
}

function parseRuleId(ruleId: string): string {
  const value = ruleId.trim();

  if (value.length === 0) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'ruleId' path parameter");
  }

  return value;
}

meNotificationsRoute.get("/notifications", (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const items = listNotificationRulesForUser(auth.user.id);

  return c.json({
    data: {
      items,
    },
  });
});

meNotificationsRoute.post("/notifications", async (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const body = parseCreateBody(await c.req.json());

  const rule = createNotificationRuleForUser({
    userId: auth.user.id,
    channel: body.channel,
    keyword: body.keyword,
  });

  return c.json({
    data: {
      rule,
    },
  });
});

meNotificationsRoute.put("/notifications/:ruleId", async (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const ruleId = parseRuleId(c.req.param("ruleId"));
  const body = parseUpdateBody(await c.req.json());

  const rule = updateNotificationRuleForUser({
    userId: auth.user.id,
    ruleId,
    keyword: body.keyword,
    enabled: body.enabled,
  });

  if (!rule) {
    throw new ApiError(404, "NOT_FOUND", "Notification rule not found");
  }

  return c.json({
    data: {
      rule,
    },
  });
});

meNotificationsRoute.delete("/notifications/:ruleId", (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));
  const ruleId = parseRuleId(c.req.param("ruleId"));

  deleteNotificationRuleForUser(auth.user.id, ruleId);

  return c.json({
    data: {
      ok: true,
    },
  });
});
