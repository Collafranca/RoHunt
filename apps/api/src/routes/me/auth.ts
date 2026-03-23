import { Hono } from "hono";

import { createSession, deleteSessionByToken } from "../../repositories/auth/sessions";
import { upsertDiscordUser } from "../../repositories/auth/users";
import { exchangeDiscordCode } from "../../services/auth/discord-oauth";
import {
  assertValidOAuthState,
  buildClearedOAuthStateCookie,
  buildClearedSessionCookie,
  buildSessionCookie,
  requireAuthSessionContext,
} from "../../services/auth/session";

export const meAuthRoute = new Hono();

meAuthRoute.get("/auth/discord/callback", (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  assertValidOAuthState(state, c.req.header("cookie"));

  const discordProfile = exchangeDiscordCode(code);
  const user = upsertDiscordUser(discordProfile);
  const session = createSession({ userId: user.id });

  c.header("set-cookie", buildSessionCookie(session.token));
  c.header("set-cookie", buildClearedOAuthStateCookie(), { append: true });

  return c.json({
    data: {
      user,
    },
  });
});

meAuthRoute.get("/auth/me", (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));

  return c.json({
    data: {
      user: auth.user,
    },
  });
});

meAuthRoute.post("/auth/logout", (c) => {
  const auth = requireAuthSessionContext(c.req.header("cookie"));

  deleteSessionByToken(auth.session.token);
  c.header("set-cookie", buildClearedSessionCookie());

  return c.json({
    data: {
      ok: true,
    },
  });
});
