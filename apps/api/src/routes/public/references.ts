import { Hono } from "hono";

import { ApiError } from "../../middleware/errors";
import { listPublicReferences } from "../../repositories/public/references";

export const publicReferencesRoute = new Hono();

publicReferencesRoute.get("/references", (c) => {
  const limit = Number(c.req.query("limit") ?? "20");
  const cursor = Number(c.req.query("cursor") ?? "0");

  if (!Number.isInteger(limit) || limit < 1) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'limit' query parameter");
  }

  if (!Number.isInteger(cursor) || cursor < 0) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'cursor' query parameter");
  }

  const source = c.req.query("source")?.trim();

  const result = listPublicReferences({
    limit,
    cursor,
    source: source && source.length > 0 ? source : undefined,
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
        ...(source && source.length > 0 ? { source } : {}),
      },
    },
  });
});
