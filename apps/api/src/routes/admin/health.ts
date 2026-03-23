import { Hono } from "hono";

export const adminHealthRoute = new Hono();

adminHealthRoute.get("/health", (c) => {
  return c.json({ ok: true });
});
