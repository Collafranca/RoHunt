import { Hono } from "hono";

import { ApiError } from "../../middleware/errors";
import {
  applyAdminUserAction,
  getAdminUserById,
  listAdminUsers,
  type AdminUserAction,
} from "../../repositories/admin/users";

type AdminUserActionBody = {
  readonly action?: unknown;
};

export const adminUsersRoute = new Hono();

function parseUserId(userId: string | undefined): string {
  const normalized = userId?.trim();

  if (!normalized) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'userId' path parameter");
  }

  return normalized;
}

async function parseJsonBody(c: { req: { json: () => Promise<unknown> } }): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new ApiError(400, "INVALID_QUERY", "Invalid JSON body");
  }
}

function parseActionBody(body: unknown): AdminUserAction {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid admin user action body");
  }

  const normalized = body as AdminUserActionBody;

  if (normalized.action !== "suspend") {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'action' body parameter");
  }

  return normalized.action;
}

adminUsersRoute.get("/users", (c) => {
  const users = listAdminUsers();

  return c.json({
    data: {
      items: users,
    },
  });
});

adminUsersRoute.get("/users/:userId", (c) => {
  const userId = parseUserId(c.req.param("userId"));
  const user = getAdminUserById(userId);

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  return c.json({
    data: {
      user,
    },
  });
});

adminUsersRoute.post("/users/:userId/action", async (c) => {
  const userId = parseUserId(c.req.param("userId"));

  if (!getAdminUserById(userId)) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  const action = parseActionBody(await parseJsonBody(c));
  const result = applyAdminUserAction(userId, action);

  return c.json({
    data: {
      result,
    },
  });
});
