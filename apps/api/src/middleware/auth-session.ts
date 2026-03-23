import type { MiddlewareHandler } from "hono";

import { ApiError } from "./errors";
import { getAuthSessionContextFromCookie } from "../services/auth/session";

const UNPROTECTED_ME_PATHS = new Set<string>(["/v1/me/auth/discord/callback"]);

export const authSessionMiddleware: MiddlewareHandler = async (c, next) => {
  if (UNPROTECTED_ME_PATHS.has(c.req.path)) {
    await next();
    return;
  }

  const auth = getAuthSessionContextFromCookie(c.req.header("cookie"));

  if (!auth) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  await next();
};
