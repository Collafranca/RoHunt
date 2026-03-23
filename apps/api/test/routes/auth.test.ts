import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../../src/app";
import { clearSessionsRepository } from "../../src/repositories/auth/sessions";
import { clearUsersRepository } from "../../src/repositories/auth/users";

const OAUTH_STATE_COOKIE_NAME = "rohunt_oauth_state";

function extractCookieValue(setCookie: string, name: string): string | null {
  const firstPart = setCookie.split(";")[0]?.trim();

  if (!firstPart) {
    return null;
  }

  const [cookieName, ...valueParts] = firstPart.split("=");

  if (cookieName !== name) {
    return null;
  }

  const value = valueParts.join("=").trim();
  return value || null;
}

describe("me auth routes", () => {
  beforeEach(() => {
    clearSessionsRepository();
    clearUsersRepository();
  });

  it("handles OAuth callback with valid state and issues a hardened session cookie", async () => {
    const response = await app.request("/v1/me/auth/discord/callback?code=abc123&state=state_abc123", {
      headers: {
        cookie: `${OAUTH_STATE_COOKIE_NAME}=state_abc123`,
      },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.user).toMatchObject({
      discordId: "discord_abc123",
      username: "user_abc123",
    });

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("rohunt_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
  });

  it("rejects callback when code is missing", async () => {
    const response = await app.request("/v1/me/auth/discord/callback?state=state_missing_code", {
      headers: {
        cookie: `${OAUTH_STATE_COOKIE_NAME}=state_missing_code`,
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "INVALID_QUERY",
        message: "Invalid 'code' query parameter",
      },
    });
  });

  it("rejects callback when state is missing", async () => {
    const response = await app.request("/v1/me/auth/discord/callback?code=missing_state", {
      headers: {
        cookie: `${OAUTH_STATE_COOKIE_NAME}=state_missing`,
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "INVALID_QUERY",
        message: "Invalid 'state' query parameter",
      },
    });
  });

  it("rejects callback when state cookie is missing", async () => {
    const response = await app.request("/v1/me/auth/discord/callback?code=bad_state&state=state_bad_state");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "INVALID_QUERY",
        message: "Invalid 'state' query parameter",
      },
    });
  });

  it("rejects callback when state does not match cookie", async () => {
    const response = await app.request("/v1/me/auth/discord/callback?code=mismatch&state=state_expected", {
      headers: {
        cookie: `${OAUTH_STATE_COOKIE_NAME}=state_actual`,
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "INVALID_QUERY",
        message: "Invalid 'state' query parameter",
      },
    });
  });

  it("returns current user from /v1/me/auth/me when session cookie is provided", async () => {
    const callback = await app.request("/v1/me/auth/discord/callback?code=session_me&state=state_session_me", {
      headers: {
        cookie: `${OAUTH_STATE_COOKIE_NAME}=state_session_me`,
      },
    });
    const setCookie = callback.headers.get("set-cookie");

    expect(setCookie).toBeTruthy();

    const response = await app.request("/v1/me/auth/me", {
      headers: {
        cookie: setCookie!.split(";")[0],
      },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.user).toMatchObject({
      discordId: "discord_session_me",
      username: "user_session_me",
    });
  });

  it("returns unauthorized from /v1/me/auth/me without a session", async () => {
    const response = await app.request("/v1/me/auth/me");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  });

  it("returns unauthorized from /v1/me/auth/logout without a session", async () => {
    const response = await app.request("/v1/me/auth/logout", {
      method: "POST",
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  });

  it("logs out and clears the hardened session cookie", async () => {
    const callback = await app.request("/v1/me/auth/discord/callback?code=logout_flow&state=state_logout_flow", {
      headers: {
        cookie: `${OAUTH_STATE_COOKIE_NAME}=state_logout_flow`,
      },
    });
    const setCookie = callback.headers.get("set-cookie");

    expect(setCookie).toBeTruthy();

    const logoutResponse = await app.request("/v1/me/auth/logout", {
      method: "POST",
      headers: {
        cookie: setCookie!.split(";")[0],
      },
    });

    expect(logoutResponse.status).toBe(200);

    const clearedCookie = logoutResponse.headers.get("set-cookie");
    expect(clearedCookie).toContain("rohunt_session=");
    expect(clearedCookie).toContain("HttpOnly");
    expect(clearedCookie).toContain("Secure");
    expect(clearedCookie).toContain("Max-Age=0");

    const meResponse = await app.request("/v1/me/auth/me", {
      headers: {
        cookie: setCookie!.split(";")[0],
      },
    });

    expect(meResponse.status).toBe(401);
    await expect(meResponse.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  });

  it("clears oauth state cookie after successful callback", async () => {
    const response = await app.request("/v1/me/auth/discord/callback?code=state_clear&state=state_clear", {
      headers: {
        cookie: `${OAUTH_STATE_COOKIE_NAME}=state_clear`,
      },
    });

    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();

    const stateCleared = setCookie!
      .split(",")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${OAUTH_STATE_COOKIE_NAME}=`));

    expect(stateCleared).toBeTruthy();
    expect(stateCleared).toContain("Max-Age=0");
    expect(extractCookieValue(stateCleared!, OAUTH_STATE_COOKIE_NAME)).toBeNull();
  });
});
