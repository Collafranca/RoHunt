import { Hono } from "hono";

import { ApiError } from "../../middleware/errors";
import { listPublicScams } from "../../repositories/public/scams";

export const publicScamsRoute = new Hono();

publicScamsRoute.get("/scams", (c) => {
  const limit = Number(c.req.query("limit") ?? "20");
  const cursor = Number(c.req.query("cursor") ?? "0");

  if (!Number.isInteger(limit) || limit < 1) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'limit' query parameter");
  }

  if (!Number.isInteger(cursor) || cursor < 0) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'cursor' query parameter");
  }

  const severity = c.req.query("severity")?.trim();

  const result = listPublicScams({
    limit,
    cursor,
    severity: severity && severity.length > 0 ? severity : undefined,
  });

  return c.json({
    data: result.data,
    meta: {
      pagination: {
        limit,
        cursor,
        nextCursor: result.nextCursor,
        total: result.total,
      },
      filters: {
        ...(severity && severity.length > 0 ? { severity } : {}),
      },
    },
  });
});
