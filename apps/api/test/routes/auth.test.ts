import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../../src/app";

describe("me auth routes", () => {
  beforeEach(async () => {
    const callback = await app.request("/v1/me/auth/discord/callback?code=reset_state");
    const cookieHeader = callback.headers.get("set-cookie");

    if (!cookieHeader) {
      return;
    }

    await app.request("/v1/me/auth/logout", {
      method: "POST",
      headers: {
        cookie: cookieHeader.split(";")[0],
      },
    });
  });

  it("handles OAuth callback and issues a session cookie", async () => {
    const response = await app.request("/v1/me/auth/discord/callback?code=abc123");

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
  });

  it("returns current user from /v1/me/auth/me when session cookie is provided", async () => {
    const callback = await app.request("/v1/me/auth/discord/callback?code=session_me");
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

  it("logs out and invalidates the session cookie", async () => {
    const callback = await app.request("/v1/me/auth/discord/callback?code=logout_flow");
    const setCookie = callback.headers.get("set-cookie");

    expect(setCookie).toBeTruthy();

    const logoutResponse = await app.request("/v1/me/auth/logout", {
      method: "POST",
      headers: {
        cookie: setCookie!.split(";")[0],
      },
    });

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.headers.get("set-cookie")).toContain("rohunt_session=");

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
});
