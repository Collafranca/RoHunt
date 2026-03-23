import type { MiddlewareHandler } from "hono";

import { ApiError } from "./errors";
import { getAuthSessionContextFromCookie } from "../services/auth/session";

export const authAdminMiddleware: MiddlewareHandler = async (c, next) => {
  const auth = getAuthSessionContextFromCookie(c.req.header("cookie"));

  if (!auth) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  if (auth.user.role !== "admin") {
    throw new ApiError(403, "FORBIDDEN", "Admin role required");
  }

  await next();
};
