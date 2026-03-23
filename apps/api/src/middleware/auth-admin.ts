import type { MiddlewareHandler } from "hono";

import { ApiError } from "./errors";

export const authAdminMiddleware: MiddlewareHandler = async (_c, _next) => {
  throw new ApiError(403, "FORBIDDEN", "Forbidden");
};
