import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../../..");

describe("core web structural route guard checks", () => {
  it("renders core public routes through Astro pages", () => {
    const routes = [
      { file: "apps/web/src/pages/index.astro", heading: "RoHunt" },
      { file: "apps/web/src/pages/jobs.astro", heading: "Jobs" },
      { file: "apps/web/src/pages/scams.astro", heading: "Scams" },
      { file: "apps/web/src/pages/analytics.astro", heading: "Analytics" },
    ];

    for (const route of routes) {
      const source = readFileSync(resolve(root, route.file), "utf8");
      expect(source).toContain("<AppShell>");
      expect(source).toContain(`<h1>${route.heading}</h1>`);
      expect(source).toContain("data-state={state.kind}");
    }
  });

  it("keeps core journeys wired to API client entry points", () => {
    const expectations = [
      { file: "apps/web/src/pages/index.astro", call: "getHomePageData" },
      { file: "apps/web/src/pages/jobs.astro", call: "getJobsPageData" },
      { file: "apps/web/src/pages/scams.astro", call: "getScamsPageData" },
      { file: "apps/web/src/pages/analytics.astro", call: "getAnalyticsPageData" },
    ];

    for (const item of expectations) {
      const source = readFileSync(resolve(root, item.file), "utf8");
      expect(source).toContain(`await ${item.call}(`);
    }
  });
});
