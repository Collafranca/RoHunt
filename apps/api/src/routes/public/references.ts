import { Hono } from "hono";

import { listPublicReferences } from "../../repositories/public/references";
import { parsePublicPaginationQuery } from "./pagination";

export const publicReferencesRoute = new Hono();

publicReferencesRoute.get("/references", (c) => {
  const { limit, cursor } = parsePublicPaginationQuery(c);

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
