import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../../..");

describe("api contract structural route guards", () => {
  it("keeps v1 route mounts stable in app entrypoint", () => {
    const appSource = readFileSync(resolve(root, "apps/api/src/app.ts"), "utf8");

    expect(appSource).toContain('app.route("/v1/public", publicHealthRoute)');
    expect(appSource).toContain('app.route("/v1/public", publicJobsRoute)');
    expect(appSource).toContain('app.route("/v1/public", publicScamsRoute)');
    expect(appSource).toContain('app.route("/v1/public", publicReferencesRoute)');
    expect(appSource).toContain('app.route("/v1/public", publicStatusRoute)');

    expect(appSource).toContain('app.route("/v1/me", meAuthRoute)');
    expect(appSource).toContain('app.route("/v1/me", meSavedJobsRoute)');
    expect(appSource).toContain('app.route("/v1/me", meNotificationsRoute)');

    expect(appSource).toContain('app.route("/v1/admin", adminHealthRoute)');
    expect(appSource).toContain('app.route("/v1/admin", adminUsersRoute)');

    expect(appSource).toContain('app.route("/v1/internal", internalHealthRoute)');
    expect(appSource).toContain('app.route("/v1/internal", internalIngestRoute)');
  });

  it("retains public contract route strings in public route tests", () => {
    const source = readFileSync(resolve(root, "apps/api/test/routes/public.test.ts"), "utf8");

    const expectedRoutes = [
      "/v1/public/jobs",
      "/v1/public/scams",
      "/v1/public/references",
      "/v1/public/status",
    ];

    for (const route of expectedRoutes) {
      expect(source).toContain(route);
    }
  });
});
