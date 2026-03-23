import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { app } from "../src/app";
import { handleError } from "../src/middleware/errors";
import { requestIdMiddleware } from "../src/middleware/request-id";

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

  it("generates request id when header is missing", async () => {
    const response = await app.request("/v1/public/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
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

  it("normalizes unknown thrown errors to 500 and preserves request id header", async () => {
    const throwApp = new Hono();
    throwApp.use("*", requestIdMiddleware);
    throwApp.get("/boom", () => {
      throw new Error("unexpected");
    });
    throwApp.onError(handleError);

    const response = await throwApp.request("/boom", {
      headers: {
        "x-request-id": "req-unknown-500",
      },
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
      requestId: "req-unknown-500",
    });
    expect(response.headers.get("x-request-id")).toBe("req-unknown-500");
  });

  it("rejects me/admin/internal namespaces without auth", async () => {
    const meResponse = await app.request("/v1/me/health");
    const adminResponse = await app.request("/v1/admin/health");
    const internalResponse = await app.request("/v1/internal/health");

    expect(meResponse.status).toBe(401);
    expect(adminResponse.status).toBe(401);
    expect(internalResponse.status).toBe(401);

    await expect(meResponse.json()).resolves.toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });
    await expect(adminResponse.json()).resolves.toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });
    await expect(internalResponse.json()).resolves.toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });
  });
});
