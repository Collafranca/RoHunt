import { describe, expect, it } from "vitest";

import { app } from "../../src/app";

describe("public v1 routes", () => {
  it("returns filtered jobs with paginated envelope", async () => {
    const response = await app.request("/v1/public/jobs?limit=2&cursor=0&type=scripting");

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.meta.pagination).toEqual({
      limit: 2,
      cursor: 0,
      nextCursor: null,
      total: 2,
    });
    expect(body.meta.filters).toEqual({ type: "scripting" });
    expect(body.data).toHaveLength(2);
    expect(body.data.every((job: { type: string }) => job.type === "scripting")).toBe(true);
  });

  it("returns filtered scams with paginated envelope", async () => {
    const response = await app.request("/v1/public/scams?limit=1&cursor=0&severity=high");

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.meta.pagination).toEqual({
      limit: 1,
      cursor: 0,
      nextCursor: 1,
      total: 2,
    });
    expect(body.meta.filters).toEqual({ severity: "high" });
    expect(body.data).toHaveLength(1);
    expect(body.data[0].severity).toBe("high");
  });

  it("returns filtered references with normalized envelope", async () => {
    const response = await app.request("/v1/public/references?limit=2&cursor=0&source=discord");

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.meta.pagination).toEqual({
      limit: 2,
      cursor: 0,
      nextCursor: null,
      total: 2,
    });
    expect(body.meta.filters).toEqual({ source: "discord" });
    expect(body.data).toHaveLength(2);
    expect(body.data.every((reference: { source: string }) => reference.source === "discord")).toBe(true);
  });

  it("returns public status with normalized envelope", async () => {
    const response = await app.request("/v1/public/status");

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.data).toMatchObject({
      ok: true,
      service: "api",
      version: "v1",
    });
    expect(typeof body.meta.generatedAt).toBe("string");
  });

  it("returns normalized error shape for invalid non-numeric limit", async () => {
    const response = await app.request("/v1/public/jobs?limit=abc", {
      headers: {
        "x-request-id": "req-public-limit-non-numeric",
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_QUERY",
        message: "Invalid 'limit' query parameter",
      },
      requestId: "req-public-limit-non-numeric",
    });
    expect(response.headers.get("x-request-id")).toBe("req-public-limit-non-numeric");
  });

  it("returns normalized error shape for invalid float limit", async () => {
    const response = await app.request("/v1/public/jobs?limit=1.5", {
      headers: {
        "x-request-id": "req-public-limit-float",
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_QUERY",
        message: "Invalid 'limit' query parameter",
      },
      requestId: "req-public-limit-float",
    });
    expect(response.headers.get("x-request-id")).toBe("req-public-limit-float");
  });

  it("returns normalized error shape for over-maximum limit", async () => {
    const response = await app.request("/v1/public/scams?limit=101", {
      headers: {
        "x-request-id": "req-public-limit-maximum",
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_QUERY",
        message: "Invalid 'limit' query parameter",
      },
      requestId: "req-public-limit-maximum",
    });
    expect(response.headers.get("x-request-id")).toBe("req-public-limit-maximum");
  });

  it("returns normalized error shape for invalid non-numeric cursor", async () => {
    const response = await app.request("/v1/public/scams?cursor=not-a-number", {
      headers: {
        "x-request-id": "req-public-cursor-non-numeric",
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_QUERY",
        message: "Invalid 'cursor' query parameter",
      },
      requestId: "req-public-cursor-non-numeric",
    });
    expect(response.headers.get("x-request-id")).toBe("req-public-cursor-non-numeric");
  });

  it("returns normalized error shape for invalid float cursor", async () => {
    const response = await app.request("/v1/public/scams?cursor=0.5", {
      headers: {
        "x-request-id": "req-public-cursor-float",
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_QUERY",
        message: "Invalid 'cursor' query parameter",
      },
      requestId: "req-public-cursor-float",
    });
    expect(response.headers.get("x-request-id")).toBe("req-public-cursor-float");
  });

  it("returns normalized error shape for invalid cursor on references endpoint", async () => {
    const response = await app.request("/v1/public/references?cursor=-1", {
      headers: {
        "x-request-id": "req-public-references-cursor",
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_QUERY",
        message: "Invalid 'cursor' query parameter",
      },
      requestId: "req-public-references-cursor",
    });
    expect(response.headers.get("x-request-id")).toBe("req-public-references-cursor");
  });
});

