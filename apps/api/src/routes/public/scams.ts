import { Hono } from "hono";

import { listPublicScams } from "../../repositories/public/scams";
import { parsePublicPaginationQuery } from "./pagination";

export const publicScamsRoute = new Hono();

publicScamsRoute.get("/scams", (c) => {
  const { limit, cursor } = parsePublicPaginationQuery(c);

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
