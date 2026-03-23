import { Hono } from "hono";

import { getAdminPlatformStats } from "../../repositories/admin/stats";

export const adminStatsRoute = new Hono();

adminStatsRoute.get("/stats", (c) => {
  const stats = getAdminPlatformStats();

  return c.json({
    data: stats,
    meta: {
      generatedAt: new Date().toISOString(),
    },
  });
});
