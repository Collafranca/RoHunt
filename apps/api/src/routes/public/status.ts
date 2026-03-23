import { Hono } from "hono";

import { getPublicStatus } from "../../repositories/public/status";

export const publicStatusRoute = new Hono();

publicStatusRoute.get("/status", (c) => {
  const status = getPublicStatus();

  return c.json({
    data: status,
    meta: {
      generatedAt: new Date().toISOString(),
    },
  });
});
