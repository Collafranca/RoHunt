import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../..");

const requiredFiles = [
  "apps/web/src/pages/index.astro",
  "apps/web/src/pages/jobs.astro",
  "apps/web/src/pages/scams.astro",
  "apps/web/src/pages/analytics.astro",
  "apps/web/src/lib/api-client.ts",
  "apps/web/src/components/jobs/JobsSurface.tsx",
  "apps/web/src/components/scams/ScamsSurface.tsx",
  "apps/web/src/components/analytics/AnalyticsSurface.tsx",
];

const pageFiles = [
  "apps/web/src/pages/index.astro",
  "apps/web/src/pages/jobs.astro",
  "apps/web/src/pages/scams.astro",
  "apps/web/src/pages/analytics.astro",
].map((file) => resolve(root, file));

const nonClientSourceFiles = [
  ...pageFiles,
  resolve(root, "apps/web/src/components/jobs/JobsSurface.tsx"),
  resolve(root, "apps/web/src/components/scams/ScamsSurface.tsx"),
  resolve(root, "apps/web/src/components/analytics/AnalyticsSurface.tsx"),
];

describe("web public routes task 14", () => {
  it("creates all required Task 14 files", () => {
    for (const relativePath of requiredFiles) {
      expect(existsSync(resolve(root, relativePath)), relativePath).toBe(true);
    }
  });

  it("implements SSR route fetches through api-client", () => {
    const expectations = [
      {
        file: resolve(root, "apps/web/src/pages/index.astro"),
        apiCall: "getHomePageData",
        componentCall: "renderHomeState",
      },
      {
        file: resolve(root, "apps/web/src/pages/jobs.astro"),
        apiCall: "getJobsPageData",
        componentCall: "renderJobsState",
      },
      {
        file: resolve(root, "apps/web/src/pages/scams.astro"),
        apiCall: "getScamsPageData",
        componentCall: "renderScamsState",
      },
      {
        file: resolve(root, "apps/web/src/pages/analytics.astro"),
        apiCall: "getAnalyticsPageData",
        componentCall: "renderAnalyticsState",
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

  it("avoids unsafe set:html in public pages", () => {
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

  it("renders jobs/scams/analytics helpers with behavior-level state outputs", async () => {
    const jobsModuleUrl = `${pathToFileURL(resolve(root, "apps/web/src/components/jobs/JobsSurface.tsx")).href}?task14-jobs=${Date.now()}`;
    const scamsModuleUrl = `${pathToFileURL(resolve(root, "apps/web/src/components/scams/ScamsSurface.tsx")).href}?task14-scams=${Date.now()}`;
    const analyticsModuleUrl = `${pathToFileURL(resolve(root, "apps/web/src/components/analytics/AnalyticsSurface.tsx")).href}?task14-analytics=${Date.now()}`;

    const { renderJobsState } = await import(jobsModuleUrl);
    const { renderScamsState } = await import(scamsModuleUrl);
    const { renderAnalyticsState } = await import(analyticsModuleUrl);

    const behaviors = [
      { name: "jobs", render: renderJobsState, loadingFallback: "Loading jobs...", errorFallback: "Could not load jobs.", emptyFallback: "No jobs found." },
      { name: "scams", render: renderScamsState, loadingFallback: "Loading scam reports...", errorFallback: "Could not load scam reports.", emptyFallback: "No scam reports found." },
      { name: "analytics", render: renderAnalyticsState, loadingFallback: "Loading analytics...", errorFallback: "Could not load analytics.", emptyFallback: "No analytics available." },
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

  it("builds request URLs from the generated client operations", async () => {
    const clientPath = resolve(root, "apps/web/src/lib/api-client.ts");

    expect(existsSync(clientPath)).toBe(true);

    const moduleUrl = `${pathToFileURL(clientPath).href}?task14=${Date.now()}`;
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

    await api.getJobsPageData({ baseUrl, fetchImpl });
    await api.getScamsPageData({ baseUrl, fetchImpl });
    await api.getAnalyticsPageData({ baseUrl, fetchImpl });
    await api.getHomePageData({ baseUrl, fetchImpl });

    expect(calls).toHaveLength(4);
    expect(calls[0]).toEqual({ url: "https://example.test/v1/public/jobs", method: "GET" });
    expect(calls[1]).toEqual({ url: "https://example.test/v1/public/scams", method: "GET" });
    expect(calls[2]).toEqual({ url: "https://example.test/v1/public/references", method: "GET" });
    expect(calls[3]).toEqual({ url: "https://example.test/v1/public/status", method: "GET" });
  });

  it("returns explicit configuration error when base URL is missing, including development", async () => {
    const clientPath = resolve(root, "apps/web/src/lib/api-client.ts");
    const moduleUrl = `${pathToFileURL(clientPath).href}?task14-base-url=${Date.now()}`;
    const api = await import(moduleUrl);

    const originalNodeEnv = process.env.NODE_ENV;
    const originalApiBase = process.env.ROHUNT_API_BASE_URL;
    const originalPublicApiBase = process.env.PUBLIC_ROHUNT_API_BASE_URL;

    process.env.NODE_ENV = "development";
    delete process.env.ROHUNT_API_BASE_URL;
    delete process.env.PUBLIC_ROHUNT_API_BASE_URL;

    try {
      const result = await api.getJobsPageData({
        fetchImpl: async () =>
          new Response(JSON.stringify([{ id: 1 }]), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      });

      expect(result.kind).toBe("error");
      expect(result.message).toBe("API base URL is not configured.");
      expect(result.items).toEqual([]);
    } finally {
      if (originalNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = originalNodeEnv;
      }

      if (originalApiBase === undefined) {
        delete process.env.ROHUNT_API_BASE_URL;
      } else {
        process.env.ROHUNT_API_BASE_URL = originalApiBase;
      }

      if (originalPublicApiBase === undefined) {
        delete process.env.PUBLIC_ROHUNT_API_BASE_URL;
      } else {
        process.env.PUBLIC_ROHUNT_API_BASE_URL = originalPublicApiBase;
      }
    }
  });

  it("handles api-client state transitions for array/object/error paths", async () => {
    const clientPath = resolve(root, "apps/web/src/lib/api-client.ts");
    const moduleUrl = `${pathToFileURL(clientPath).href}?task14-states=${Date.now()}`;
    const api = await import(moduleUrl);

    const dataArray = await api.getJobsPageData({
      baseUrl: "https://example.test",
      fetchImpl: async () =>
        new Response(JSON.stringify([{ id: 1 }, { id: 2 }]), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });
    expect(dataArray.kind).toBe("data");
    expect(dataArray.items).toHaveLength(2);

    const emptyArray = await api.getJobsPageData({
      baseUrl: "https://example.test",
      fetchImpl: async () =>
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });
    expect(emptyArray.kind).toBe("empty");

    const objectPayload = await api.getJobsPageData({
      baseUrl: "https://example.test",
      fetchImpl: async () =>
        new Response(JSON.stringify({ result: "ok" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });
    expect(objectPayload.kind).toBe("data");
    expect(objectPayload.items).toHaveLength(1);

    const nonOk = await api.getJobsPageData({
      baseUrl: "https://example.test",
      fetchImpl: async () =>
        new Response(JSON.stringify({ error: true }), {
          status: 503,
          headers: { "content-type": "application/json" },
        }),
    });
    expect(nonOk.kind).toBe("error");

    const thrown = await api.getJobsPageData({
      baseUrl: "https://example.test",
      fetchImpl: async () => {
        throw new Error("boom");
      },
    });
    expect(thrown.kind).toBe("error");
  });
});
