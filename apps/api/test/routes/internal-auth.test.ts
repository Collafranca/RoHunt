import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "../../src/app";
import { clearInternalNonceStore } from "../../src/repositories/internal/nonce-store";

type InternalServiceFixture = {
  readonly serviceId: string;
  readonly secret: string;
};

const SCRAPER_SERVICE_SECRET_ENV = "INTERNAL_SCRAPER_SERVICE_SECRET";
const BOT_SERVICE_SECRET_ENV = "INTERNAL_BOT_SERVICE_SECRET";
const SCRAPER_TEST_SECRET = "test_scraper_secret";
const BOT_TEST_SECRET = "test_bot_secret";

const SCRAPER_SERVICE: InternalServiceFixture = {
  serviceId: "scraper-service",
  secret: SCRAPER_TEST_SECRET,
};

const BOT_SERVICE: InternalServiceFixture = {
  serviceId: "bot-service",
  secret: BOT_TEST_SECRET,
};

function setOrDeleteEnvVariable(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function signInternalRequest(input: {
  readonly service: InternalServiceFixture;
  readonly method: string;
  readonly path: string;
  readonly timestamp: string;
  readonly nonce: string;
  readonly body: string;
}): string {
  const payload = `${input.method.toUpperCase()}\n${input.path}\n${input.timestamp}\n${input.nonce}\n${input.body}`;

  return createHmac("sha256", input.service.secret).update(payload).digest("hex");
}

async function requestInternalRoute(input: {
  readonly service: InternalServiceFixture;
  readonly path: string;
  readonly body: string;
  readonly nonce: string;
  readonly timestamp: string;
  readonly method?: string;
  readonly signature?: string;
}) {
  const method = input.method ?? "POST";
  const signature =
    input.signature ??
    signInternalRequest({
      service: input.service,
      method,
      path: input.path,
      timestamp: input.timestamp,
      nonce: input.nonce,
      body: input.body,
    });

  const requestInit: RequestInit = {
    method,
    headers: {
      "content-type": "application/json",
      "x-internal-service": input.service.serviceId,
      "x-internal-timestamp": input.timestamp,
      "x-internal-nonce": input.nonce,
      "x-internal-signature": signature,
    },
  };

  if (method !== "GET" && method !== "HEAD") {
    requestInit.body = input.body;
  }

  return app.request(input.path, requestInit);
}

describe("internal v1 signed auth", () => {
  const originalScraperSecret = process.env[SCRAPER_SERVICE_SECRET_ENV];
  const originalBotSecret = process.env[BOT_SERVICE_SECRET_ENV];

  beforeEach(() => {
    clearInternalNonceStore();
    vi.useRealTimers();
    process.env[SCRAPER_SERVICE_SECRET_ENV] = SCRAPER_TEST_SECRET;
    process.env[BOT_SERVICE_SECRET_ENV] = BOT_TEST_SECRET;
  });

  afterEach(() => {
    clearInternalNonceStore();
    vi.useRealTimers();
    setOrDeleteEnvVariable(SCRAPER_SERVICE_SECRET_ENV, originalScraperSecret);
    setOrDeleteEnvVariable(BOT_SERVICE_SECRET_ENV, originalBotSecret);
  });

  it("rejects requests when signature does not match", async () => {
    const body = JSON.stringify({ source: "discord" });

    const response = await requestInternalRoute({
      service: SCRAPER_SERVICE,
      path: "/v1/internal/ingest/jobs",
      body,
      nonce: "nonce_signature_mismatch",
      timestamp: String(Date.now()),
      signature: "bad_signature_value",
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid internal request signature",
      },
    });
  });

  it("rejects requests when timestamp is stale", async () => {
    const body = JSON.stringify({ source: "discord" });

    const response = await requestInternalRoute({
      service: SCRAPER_SERVICE,
      path: "/v1/internal/ingest/jobs",
      body,
      nonce: "nonce_stale_timestamp",
      timestamp: String(Date.now() - 10 * 60 * 1000),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        message: "Stale internal request timestamp",
      },
    });
  });

  it("rejects nonce replay under parallel duplicate requests", async () => {
    const body = JSON.stringify({ source: "discord" });
    const nonce = "nonce_parallel_replay";
    const timestamp = String(Date.now());

    const [firstResponse, secondResponse] = await Promise.all([
      requestInternalRoute({
        service: SCRAPER_SERVICE,
        path: "/v1/internal/ingest/jobs",
        body,
        nonce,
        timestamp,
      }),
      requestInternalRoute({
        service: SCRAPER_SERVICE,
        path: "/v1/internal/ingest/jobs",
        body,
        nonce,
        timestamp,
      }),
    ]);

    const statuses = [firstResponse.status, secondResponse.status].sort((left, right) => left - right);
    expect(statuses).toEqual([202, 401]);
  });

  it("allows nonce reuse after failed authentication attempt", async () => {
    const body = JSON.stringify({ source: "discord" });
    const nonce = "nonce_released_on_auth_failure";
    const timestamp = String(Date.now());

    const invalidSignatureResponse = await requestInternalRoute({
      service: SCRAPER_SERVICE,
      path: "/v1/internal/ingest/jobs",
      body,
      nonce,
      timestamp,
      signature: "invalid_signature_for_release_check",
    });

    expect(invalidSignatureResponse.status).toBe(401);

    const retryResponse = await requestInternalRoute({
      service: SCRAPER_SERVICE,
      path: "/v1/internal/ingest/jobs",
      body,
      nonce,
      timestamp,
    });

    expect(retryResponse.status).toBe(202);
  });

  it("expires replay nonce entries after freshness window", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-23T00:00:00.000Z"));

    const body = JSON.stringify({ source: "discord" });
    const nonce = "nonce_ttl_expiry";

    const firstResponse = await requestInternalRoute({
      service: SCRAPER_SERVICE,
      path: "/v1/internal/ingest/jobs",
      body,
      nonce,
      timestamp: String(Date.now()),
    });

    expect(firstResponse.status).toBe(202);

    vi.setSystemTime(new Date("2026-03-23T00:06:00.000Z"));

    const replayAfterTtlResponse = await requestInternalRoute({
      service: SCRAPER_SERVICE,
      path: "/v1/internal/ingest/jobs",
      body,
      nonce,
      timestamp: String(Date.now()),
    });

    expect(replayAfterTtlResponse.status).toBe(202);
  });

  it("allows mapped internal health route for service with health scope", async () => {
    const response = await requestInternalRoute({
      service: SCRAPER_SERVICE,
      method: "GET",
      path: "/v1/internal/health",
      body: "",
      nonce: "nonce_health_scope_allowed",
      timestamp: String(Date.now()),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });

  it("rejects internal health route for service missing health scope", async () => {
    const response = await requestInternalRoute({
      service: BOT_SERVICE,
      method: "GET",
      path: "/v1/internal/health",
      body: "",
      nonce: "nonce_health_scope_missing",
      timestamp: String(Date.now()),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "FORBIDDEN",
        message: "Insufficient internal scope",
      },
    });
  });

  it("rejects unmapped internal routes with fail-closed scope check", async () => {
    const body = JSON.stringify({ source: "discord" });

    const response = await requestInternalRoute({
      service: SCRAPER_SERVICE,
      path: "/v1/internal/unmapped-route",
      body,
      nonce: "nonce_unmapped_route",
      timestamp: String(Date.now()),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "FORBIDDEN",
        message: "Insufficient internal scope",
      },
    });
  });

  it("rejects known services when secret is not configured in environment", async () => {
    delete process.env[SCRAPER_SERVICE_SECRET_ENV];

    const body = JSON.stringify({ source: "discord" });

    const response = await requestInternalRoute({
      service: {
        serviceId: "scraper-service",
        secret: "scraper-service-secret-v1",
      },
      path: "/v1/internal/ingest/jobs",
      body,
      nonce: "nonce_missing_env_secret",
      timestamp: String(Date.now()),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  });
});
