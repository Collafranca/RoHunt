import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { app } from "../../src/app";

type InternalServiceFixture = {
  readonly serviceId: string;
  readonly secret: string;
};

const SCRAPER_SERVICE: InternalServiceFixture = {
  serviceId: "scraper-service",
  secret: "scraper-service-secret-v1",
};

const BOT_SERVICE: InternalServiceFixture = {
  serviceId: "bot-service",
  secret: "bot-service-secret-v1",
};

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
  readonly signature?: string;
}) {
  const signature =
    input.signature ??
    signInternalRequest({
      service: input.service,
      method: "POST",
      path: input.path,
      timestamp: input.timestamp,
      nonce: input.nonce,
      body: input.body,
    });

  return app.request(input.path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-service": input.service.serviceId,
      "x-internal-timestamp": input.timestamp,
      "x-internal-nonce": input.nonce,
      "x-internal-signature": signature,
    },
    body: input.body,
  });
}

describe("internal v1 signed auth", () => {

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

  it("rejects nonce replay after first successful request", async () => {
    const body = JSON.stringify({ source: "discord" });
    const nonce = "nonce_replay_check";
    const timestamp = String(Date.now());

    const firstResponse = await requestInternalRoute({
      service: SCRAPER_SERVICE,
      path: "/v1/internal/ingest/jobs",
      body,
      nonce,
      timestamp,
    });

    expect(firstResponse.status).toBe(202);

    const replayResponse = await requestInternalRoute({
      service: SCRAPER_SERVICE,
      path: "/v1/internal/ingest/jobs",
      body,
      nonce,
      timestamp,
    });

    expect(replayResponse.status).toBe(401);
    await expect(replayResponse.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        message: "Replay nonce detected",
      },
    });
  });

  it("rejects requests with insufficient route scope", async () => {
    const body = JSON.stringify({ source: "discord" });

    const response = await requestInternalRoute({
      service: BOT_SERVICE,
      path: "/v1/internal/ingest/jobs",
      body,
      nonce: "nonce_scope_reject",
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
});
