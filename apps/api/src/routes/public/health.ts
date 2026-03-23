import { Hono } from "hono";

export const publicHealthRoute = new Hono();

publicHealthRoute.get("/health", (c) => {
  return c.json({ ok: true });
});
