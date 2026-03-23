import type { MiddlewareHandler } from "hono";

import { ApiError } from "./errors";

export const authInternalMiddleware: MiddlewareHandler = async (_c, _next) => {
  throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
};
