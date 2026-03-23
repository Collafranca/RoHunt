import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../../src/app";
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

describe("me feature routes", () => {
  beforeEach(() => {
    clearSessionsRepository();
    clearUsersRepository();
  });

  it("supports save and unsave on saved jobs", async () => {
    const cookie = await createSessionCookie("saved_jobs");

    const saveResponse = await app.request("/v1/me/saved-jobs", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ jobId: "job_123" }),
    });

    expect(saveResponse.status).toBe(200);
    await expect(saveResponse.json()).resolves.toMatchObject({
      data: {
        savedJob: {
          jobId: "job_123",
        },
      },
    });

    const listResponse = await app.request("/v1/me/saved-jobs", {
      headers: { cookie },
    });

    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toMatchObject({
      data: {
        items: [{ jobId: "job_123" }],
      },
    });

    const unsaveResponse = await app.request("/v1/me/saved-jobs", {
      method: "DELETE",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ jobId: "job_123" }),
    });

    expect(unsaveResponse.status).toBe(200);
    await expect(unsaveResponse.json()).resolves.toMatchObject({
      data: {
        ok: true,
      },
    });
  });

  it("supports notification rule CRUD", async () => {
    const cookie = await createSessionCookie("notifications");

    const createResponse = await app.request("/v1/me/notifications", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        channel: "discord_dm",
        keyword: "scripter",
      }),
    });

    expect(createResponse.status).toBe(200);

    const createdBody = await createResponse.json();
    expect(createdBody.data.rule).toMatchObject({
      channel: "discord_dm",
      keyword: "scripter",
      enabled: true,
    });

    const ruleId = createdBody.data.rule.id as string;

    const updateResponse = await app.request(`/v1/me/notifications/${ruleId}`, {
      method: "PUT",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        keyword: "builder",
        enabled: false,
      }),
    });

    expect(updateResponse.status).toBe(200);
    await expect(updateResponse.json()).resolves.toMatchObject({
      data: {
        rule: {
          id: ruleId,
          channel: "discord_dm",
          keyword: "builder",
          enabled: false,
        },
      },
    });

    const listResponse = await app.request("/v1/me/notifications", {
      headers: { cookie },
    });

    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toMatchObject({
      data: {
        items: [
          {
            id: ruleId,
            keyword: "builder",
            enabled: false,
          },
        ],
      },
    });

    const deleteResponse = await app.request(`/v1/me/notifications/${ruleId}`, {
      method: "DELETE",
      headers: { cookie },
    });

    expect(deleteResponse.status).toBe(200);
    await expect(deleteResponse.json()).resolves.toMatchObject({
      data: {
        ok: true,
      },
    });
  });

  it("supports background check submission and history", async () => {
    const cookie = await createSessionCookie("checks");

    const submitResponse = await app.request("/v1/me/background-check", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        targetUserId: "user_42",
        note: "Potential scam report",
      }),
    });

    expect(submitResponse.status).toBe(200);
    await expect(submitResponse.json()).resolves.toMatchObject({
      data: {
        check: {
          targetUserId: "user_42",
          note: "Potential scam report",
          status: "submitted",
        },
      },
    });

    const historyResponse = await app.request("/v1/me/background-check", {
      headers: { cookie },
    });

    expect(historyResponse.status).toBe(200);
    await expect(historyResponse.json()).resolves.toMatchObject({
      data: {
        items: [
          {
            targetUserId: "user_42",
            status: "submitted",
          },
        ],
      },
    });
  });

  it("supports portfolio review submission and history", async () => {
    const cookie = await createSessionCookie("reviews");

    const submitResponse = await app.request("/v1/me/portfolio-reviews", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        portfolioUrl: "https://portfolio.example/dev",
        focus: "ui polish",
      }),
    });

    expect(submitResponse.status).toBe(200);
    await expect(submitResponse.json()).resolves.toMatchObject({
      data: {
        review: {
          portfolioUrl: "https://portfolio.example/dev",
          focus: "ui polish",
          status: "queued",
        },
      },
    });

    const historyResponse = await app.request("/v1/me/portfolio-reviews", {
      headers: { cookie },
    });

    expect(historyResponse.status).toBe(200);
    await expect(historyResponse.json()).resolves.toMatchObject({
      data: {
        items: [
          {
            portfolioUrl: "https://portfolio.example/dev",
            status: "queued",
          },
        ],
      },
    });
  });

  it("supports settings read, update, and delete-account", async () => {
    const cookie = await createSessionCookie("settings");

    const initialSettings = await app.request("/v1/me/settings", {
      headers: { cookie },
    });

    expect(initialSettings.status).toBe(200);
    await expect(initialSettings.json()).resolves.toMatchObject({
      data: {
        settings: {
          jobAlertsEnabled: true,
          visibility: "public",
        },
      },
    });

    const updateResponse = await app.request("/v1/me/settings", {
      method: "PUT",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jobAlertsEnabled: false,
        visibility: "private",
      }),
    });

    expect(updateResponse.status).toBe(200);
    await expect(updateResponse.json()).resolves.toMatchObject({
      data: {
        settings: {
          jobAlertsEnabled: false,
          visibility: "private",
        },
      },
    });

    const deleteAccountResponse = await app.request("/v1/me/settings/account", {
      method: "DELETE",
      headers: { cookie },
    });

    expect(deleteAccountResponse.status).toBe(200);
    await expect(deleteAccountResponse.json()).resolves.toMatchObject({
      data: {
        ok: true,
      },
    });

    const meAfterDeleteResponse = await app.request("/v1/me/auth/me", {
      headers: { cookie },
    });

    expect(meAfterDeleteResponse.status).toBe(401);
    await expect(meAfterDeleteResponse.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHORIZED",
      },
    });
  });
});
