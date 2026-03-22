import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as contractsClient from "../src/index";

const rootOpenapiPath = resolve(process.cwd(), "openapi/root.yaml");

describe("@rohunt/contracts", () => {
  it("defines required v1 route namespaces", () => {
    const rootSpec = readFileSync(rootOpenapiPath, "utf-8");

    expect(rootSpec).toContain("/v1/public");
    expect(rootSpec).toContain("/v1/me");
    expect(rootSpec).toContain("/v1/admin");
    expect(rootSpec).toContain("/v1/internal");
  });

  it("exports required generated client operations", () => {
    const requiredOperations = [
      "getPublicJobs",
      "getPublicScams",
      "getPublicReferences",
      "getPublicStatus",
      "getMeProfile",
      "getMeSavedJobs",
      "getMeNotifications",
      "getMeBackgroundCheck",
      "getMePortfolioReviews",
      "getMeSettings",
      "getAdminUsers",
      "getAdminStats",
      "postInternalIngestJobs",
      "postInternalNotifyDispatch",
      "postInternalChecksLookup",
    ] as const;

    for (const operation of requiredOperations) {
      expect(contractsClient).toHaveProperty(operation);
      expect(contractsClient[operation]).toBeTypeOf("function");
    }
  });
});
