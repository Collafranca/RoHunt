import { Hono } from "hono";

import { ApiError } from "../../middleware/errors";
import { listPublicJobs } from "../../repositories/public/jobs";

export const publicJobsRoute = new Hono();

publicJobsRoute.get("/jobs", (c) => {
  const limit = Number(c.req.query("limit") ?? "20");
  const cursor = Number(c.req.query("cursor") ?? "0");

  if (!Number.isInteger(limit) || limit < 1) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'limit' query parameter");
  }

  if (!Number.isInteger(cursor) || cursor < 0) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'cursor' query parameter");
  }

  const type = c.req.query("type")?.trim();

  const result = listPublicJobs({
    limit,
    cursor,
    type: type && type.length > 0 ? type : undefined,
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
        ...(type && type.length > 0 ? { type } : {}),
      },
    },
  });
});
