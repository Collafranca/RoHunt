import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../..");

const requiredFiles = [
  "apps/web/src/pages/saved-jobs.astro",
  "apps/web/src/pages/notifications.astro",
  "apps/web/src/pages/background-check.astro",
  "apps/web/src/pages/portfolio-review.astro",
  "apps/web/src/pages/settings.astro",
  "apps/web/src/pages/admin/users.astro",
  "apps/web/src/pages/admin/stats.astro",
  "apps/web/src/components/notifications/NotificationsSurface.tsx",
  "apps/web/src/components/checks/ChecksSurface.tsx",
  "apps/web/src/components/reviews/ReviewsSurface.tsx",
  "apps/web/src/components/admin/AdminSurface.tsx",
  "apps/web/src/lib/api-client.ts",
];

const pageFiles = [
  "apps/web/src/pages/saved-jobs.astro",
  "apps/web/src/pages/notifications.astro",
  "apps/web/src/pages/background-check.astro",
  "apps/web/src/pages/portfolio-review.astro",
  "apps/web/src/pages/settings.astro",
  "apps/web/src/pages/admin/users.astro",
  "apps/web/src/pages/admin/stats.astro",
].map((file) => resolve(root, file));

const nonClientSourceFiles = [
  ...pageFiles,
  resolve(root, "apps/web/src/components/notifications/NotificationsSurface.tsx"),
  resolve(root, "apps/web/src/components/checks/ChecksSurface.tsx"),
  resolve(root, "apps/web/src/components/reviews/ReviewsSurface.tsx"),
  resolve(root, "apps/web/src/components/admin/AdminSurface.tsx"),
];

describe("web auth routes task 15", () => {
  it("creates all required Task 15 files", () => {
    for (const relativePath of requiredFiles) {
      expect(existsSync(resolve(root, relativePath)), relativePath).toBe(true);
    }
  });

  it("wires auth pages to api-client methods and state mappers", () => {
    const expectations = [
      {
        file: resolve(root, "apps/web/src/pages/saved-jobs.astro"),
        apiCall: "getSavedJobsPageData",
        componentCall: "renderJobsState",
      },
      {
        file: resolve(root, "apps/web/src/pages/notifications.astro"),
        apiCall: "getNotificationsPageData",
        componentCall: "renderNotificationsState",
      },
      {
        file: resolve(root, "apps/web/src/pages/background-check.astro"),
        apiCall: "getBackgroundCheckPageData",
        componentCall: "renderChecksState",
      },
      {
        file: resolve(root, "apps/web/src/pages/portfolio-review.astro"),
        apiCall: "getPortfolioReviewPageData",
        componentCall: "renderReviewsState",
      },
      {
        file: resolve(root, "apps/web/src/pages/settings.astro"),
        apiCall: "getSettingsPageData",
        componentCall: "renderHomeState",
      },
      {
        file: resolve(root, "apps/web/src/pages/admin/users.astro"),
        apiCall: "getAdminUsersPageData",
        componentCall: "renderAdminState",
      },
      {
        file: resolve(root, "apps/web/src/pages/admin/stats.astro"),
        apiCall: "getAdminStatsPageData",
        componentCall: "renderAdminState",
      },
    ];

    for (const item of expectations) {
      const source = readFileSync(item.file, "utf8");

      expect(source).toContain("import AppShell");
      expect(source).toContain(`import { ${item.apiCall} }`);
      expect(source).toContain(`import { ${item.componentCall} }`);
      expect(source).toContain(`await ${item.apiCall}(`);
      expect(source).toContain(`const state = ${item.componentCall}(`);
      expect(source).toContain("data-state={state.kind}");
    }
  });

  it("avoids unsafe set:html in auth pages", () => {
    for (const file of pageFiles) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toContain("set:html");
    }
  });

  it("keeps endpoint paths inside the client layer", () => {
    for (const file of nonClientSourceFiles) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/\/v1\//);
    }
  });

  it("renders new surface helpers with expected state fallbacks", async () => {
    const notificationsModuleUrl = `${pathToFileURL(resolve(root, "apps/web/src/components/notifications/NotificationsSurface.tsx")).href}?task15-notifications=${Date.now()}`;
    const checksModuleUrl = `${pathToFileURL(resolve(root, "apps/web/src/components/checks/ChecksSurface.tsx")).href}?task15-checks=${Date.now()}`;
    const reviewsModuleUrl = `${pathToFileURL(resolve(root, "apps/web/src/components/reviews/ReviewsSurface.tsx")).href}?task15-reviews=${Date.now()}`;
    const adminModuleUrl = `${pathToFileURL(resolve(root, "apps/web/src/components/admin/AdminSurface.tsx")).href}?task15-admin=${Date.now()}`;

    const { renderNotificationsState } = await import(notificationsModuleUrl);
    const { renderChecksState } = await import(checksModuleUrl);
    const { renderReviewsState } = await import(reviewsModuleUrl);
    const { renderAdminState } = await import(adminModuleUrl);

    const behaviors = [
      { name: "notifications", render: renderNotificationsState, loadingFallback: "Loading notifications...", errorFallback: "Could not load notifications.", emptyFallback: "No notifications found." },
      { name: "checks", render: renderChecksState, loadingFallback: "Loading background checks...", errorFallback: "Could not load background checks.", emptyFallback: "No background checks found." },
      { name: "reviews", render: renderReviewsState, loadingFallback: "Loading reviews...", errorFallback: "Could not load reviews.", emptyFallback: "No reviews found." },
      { name: "admin", render: renderAdminState, loadingFallback: "Loading admin data...", errorFallback: "Could not load admin data.", emptyFallback: "No admin records found." },
    ] as const;

    for (const behavior of behaviors) {
      const loading = behavior.render({ kind: "loading", message: "", items: [], payload: null });
      expect(loading.kind, `${behavior.name} loading kind`).toBe("loading");
      expect(loading.message, `${behavior.name} loading fallback`).toBe(behavior.loadingFallback);
      expect(loading.items, `${behavior.name} loading items`).toEqual([]);

      const error = behavior.render({ kind: "error", message: "", items: [], payload: null });
      expect(error.kind, `${behavior.name} error kind`).toBe("error");
      expect(error.message, `${behavior.name} error fallback`).toBe(behavior.errorFallback);
      expect(error.items, `${behavior.name} error items`).toEqual([]);

      const empty = behavior.render({ kind: "empty", message: "", items: [], payload: [] });
      expect(empty.kind, `${behavior.name} empty kind`).toBe("empty");
      expect(empty.message, `${behavior.name} empty fallback`).toBe(behavior.emptyFallback);
      expect(empty.items, `${behavior.name} empty items`).toEqual([]);

      const records = [{ id: 1 }, { id: 2 }];
      const data = behavior.render({ kind: "data", message: "Loaded records.", items: records, payload: records });
      expect(data.kind, `${behavior.name} data kind`).toBe("data");
      expect(data.message, `${behavior.name} data message`).toBe("Loaded records.");
      expect(data.items, `${behavior.name} data items`).toEqual(records);
    }
  });

  it("builds auth/admin request URLs from generated client operations", async () => {
    const clientPath = resolve(root, "apps/web/src/lib/api-client.ts");

    expect(existsSync(clientPath)).toBe(true);

    const moduleUrl = `${pathToFileURL(clientPath).href}?task15-client=${Date.now()}`;
    const api = await import(moduleUrl);

    const calls: Array<{ url: string; method: string }> = [];
    const baseUrl = "https://example.test";

    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET");
      calls.push({ url, method });

      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    await api.getSavedJobsPageData({ baseUrl, fetchImpl });
    await api.getNotificationsPageData({ baseUrl, fetchImpl });
    await api.getBackgroundCheckPageData({ baseUrl, fetchImpl });
    await api.getPortfolioReviewPageData({ baseUrl, fetchImpl });
    await api.getSettingsPageData({ baseUrl, fetchImpl });
    await api.getAdminUsersPageData({ baseUrl, fetchImpl });
    await api.getAdminStatsPageData({ baseUrl, fetchImpl });

    expect(calls).toHaveLength(7);
    expect(calls[0]).toEqual({ url: "https://example.test/v1/me/saved-jobs", method: "GET" });
    expect(calls[1]).toEqual({ url: "https://example.test/v1/me/notifications", method: "GET" });
    expect(calls[2]).toEqual({ url: "https://example.test/v1/me/background-check", method: "GET" });
    expect(calls[3]).toEqual({ url: "https://example.test/v1/me/portfolio-reviews", method: "GET" });
    expect(calls[4]).toEqual({ url: "https://example.test/v1/me/settings", method: "GET" });
    expect(calls[5]).toEqual({ url: "https://example.test/v1/admin/users", method: "GET" });
    expect(calls[6]).toEqual({ url: "https://example.test/v1/admin/stats", method: "GET" });
  });
});
