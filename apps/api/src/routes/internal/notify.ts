import { Hono } from "hono";

export const internalNotifyRoute = new Hono();

internalNotifyRoute.post("/notify/dispatch", (c) => {
  return c.json(
    {
      data: {
        accepted: true,
      },
    },
    202,
  );
});
