import { describe, expect, it } from "vitest";

import { app } from "../src/app";

describe("API middleware skeleton", () => {
  it("propagates request id from incoming header", async () => {
    const response = await app.request("/v1/public/health", {
      headers: {
        "x-request-id": "req-test-123",
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("req-test-123");
  });

  it("returns normalized error shape", async () => {
    const response = await app.request("/v1/me/health", {
      headers: {
        "x-request-id": "req-error-shape",
      },
    });

    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
      requestId: "req-error-shape",
    });
    expect(response.headers.get("x-request-id")).toBe("req-error-shape");
  });

  it("rejects me/admin/internal namespaces without auth", async () => {
    const meResponse = await app.request("/v1/me/health");
    const adminResponse = await app.request("/v1/admin/health");
    const internalResponse = await app.request("/v1/internal/health");

    expect(meResponse.status).toBe(401);
    expect(adminResponse.status).toBe(403);
    expect(internalResponse.status).toBe(403);

    await expect(meResponse.json()).resolves.toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });
    await expect(adminResponse.json()).resolves.toMatchObject({
      error: { code: "FORBIDDEN" },
    });
    await expect(internalResponse.json()).resolves.toMatchObject({
      error: { code: "FORBIDDEN" },
    });
  });
});
