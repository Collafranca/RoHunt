import { Hono } from "hono";

import { listPublicJobs } from "../../repositories/public/jobs";
import { parsePublicPaginationQuery } from "./pagination";

export const publicJobsRoute = new Hono();

publicJobsRoute.get("/jobs", (c) => {
  const { limit, cursor } = parsePublicPaginationQuery(c);

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
