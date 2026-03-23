import type { Context } from "hono";

import { ApiError } from "../../middleware/errors";

const DEFAULT_PUBLIC_LIST_LIMIT = 20;
const MAX_PUBLIC_LIST_LIMIT = 100;

export const parsePublicPaginationQuery = (c: Context) => {
  const limit = Number(c.req.query("limit") ?? String(DEFAULT_PUBLIC_LIST_LIMIT));
  const cursor = Number(c.req.query("cursor") ?? "0");

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PUBLIC_LIST_LIMIT) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'limit' query parameter");
  }

  if (!Number.isInteger(cursor) || cursor < 0) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'cursor' query parameter");
  }

  return {
    limit,
    cursor,
  };
};
