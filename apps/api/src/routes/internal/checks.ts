import { Hono } from "hono";

export const internalChecksRoute = new Hono();

internalChecksRoute.post("/checks/lookup", (c) => {
  return c.json({
    data: {
      result: "pending",
    },
  });
});
