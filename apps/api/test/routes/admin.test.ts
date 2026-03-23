import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../../src/app";
import { clearAdminUsersRepository } from "../../src/repositories/admin/users";
import { clearSessionsRepository } from "../../src/repositories/auth/sessions";
import { clearUsersRepository } from "../../src/repositories/auth/users";

const OAUTH_STATE_COOKIE_NAME = "rohunt_oauth_state";

async function createSessionCookie(code: string): Promise<string> {
  const response = await app.request(`/v1/me/auth/discord/callback?code=${code}&state=state_${code}`, {
    headers: {
      cookie: `${OAUTH_STATE_COOKIE_NAME}=state_${code}`,
    },
  });

  expect(response.status).toBe(200);
  const setCookie = response.headers.get("set-cookie");
  expect(setCookie).toBeTruthy();

  return setCookie!.split(";")[0];
}

describe("admin v1 routes", () => {
  beforeEach(() => {
    clearSessionsRepository();
    clearUsersRepository();
    clearAdminUsersRepository();
  });

  it("returns unauthorized for unauthenticated admin list/detail/action/stats requests", async () => {
    const listResponse = await app.request("/v1/admin/users");
    expect(listResponse.status).toBe(401);
    await expect(listResponse.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });

    const detailResponse = await app.request("/v1/admin/users/user_member");
    expect(detailResponse.status).toBe(401);
    await expect(detailResponse.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });

    const actionResponse = await app.request("/v1/admin/users/user_member/action", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ action: "suspend" }),
    });
    expect(actionResponse.status).toBe(401);
    await expect(actionResponse.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });

    const statsResponse = await app.request("/v1/admin/stats");
    expect(statsResponse.status).toBe(401);
    await expect(statsResponse.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  });

  it("denies non-admin users across admin list/detail/action/stats requests", async () => {
    const cookie = await createSessionCookie("member");

    const listResponse = await app.request("/v1/admin/users", {
      headers: { cookie },
    });
    expect(listResponse.status).toBe(403);

    const detailResponse = await app.request("/v1/admin/users/user_member", {
      headers: { cookie },
    });
    expect(detailResponse.status).toBe(403);

    const actionResponse = await app.request("/v1/admin/users/user_member/action", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ action: "suspend" }),
    });
    expect(actionResponse.status).toBe(403);

    const statsResponse = await app.request("/v1/admin/stats", {
      headers: { cookie },
    });
    expect(statsResponse.status).toBe(403);

    await expect(statsResponse.json()).resolves.toMatchObject({
      error: {
        code: "FORBIDDEN",
        message: "Admin role required",
      },
    });
  });

  it("does not grant admin access from ids that merely contain admin", async () => {
    const cookie = await createSessionCookie("notadmin");

    const response = await app.request("/v1/admin/users", {
      headers: { cookie },
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "FORBIDDEN",
        message: "Admin role required",
      },
    });
  });

  it("allows admin users listing, detail, and action endpoints", async () => {
    const cookie = await createSessionCookie("admin");

    const listResponse = await app.request("/v1/admin/users", {
      headers: { cookie },
    });

    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json();
    expect(Array.isArray(listBody.data.items)).toBe(true);
    expect(listBody.data.items.length).toBeGreaterThan(0);

    const detailResponse = await app.request("/v1/admin/users/user_member", {
      headers: { cookie },
    });

    expect(detailResponse.status).toBe(200);
    await expect(detailResponse.json()).resolves.toMatchObject({
      data: {
        user: {
          id: "user_member",
        },
      },
    });

    const actionResponse = await app.request("/v1/admin/users/user_member/action", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ action: "suspend" }),
    });

    expect(actionResponse.status).toBe(200);
    await expect(actionResponse.json()).resolves.toMatchObject({
      data: {
        result: {
          userId: "user_member",
          action: "suspend",
        },
      },
    });
  });

  it("allows admin users to read platform stats", async () => {
    const cookie = await createSessionCookie("admin_stats");

    const response = await app.request("/v1/admin/stats", {
      headers: { cookie },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        users: {
          total: expect.any(Number),
        },
        jobs: {
          total: expect.any(Number),
        },
      },
      meta: {
        generatedAt: expect.any(String),
      },
    });
  });
});
