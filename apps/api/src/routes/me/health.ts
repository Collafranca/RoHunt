import { Hono } from "hono";

export const meHealthRoute = new Hono();

meHealthRoute.get("/health", (c) => {
  return c.json({ ok: true });
});
