import { Hono } from "hono";

export const internalHealthRoute = new Hono();

internalHealthRoute.get("/health", (c) => {
  return c.json({ ok: true });
});
