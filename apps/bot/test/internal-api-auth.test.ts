import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInternalApiSigner } from "../src/internal-api/signer";
import { createInternalApiClient } from "../src/internal-api/client";
import { createBotApp } from "../src/index";
import * as commandHandlers from "../src/handlers/commands";
import * as notificationHandlers from "../src/handlers/notifications";
import { runInternalChecksLookup, type CommandHandlerDeps } from "../src/handlers/commands";
import {
  dispatchInternalNotification,
  type NotificationHandlerDeps,
} from "../src/handlers/notifications";
import {
  postInternalChecksLookup,
  postInternalNotifyDispatch,
} from "../../../packages/contracts/src/generated/client";

describe("internal API auth", () => {
  it("creates deterministic signed headers for internal requests", () => {
    const signer = createInternalApiSigner({
      serviceId: "bot-service",
      secret: "test-secret",
      now: () => 1700000000000,
    });

    const request = postInternalNotifyDispatch();
    const body = JSON.stringify({ jobId: "123" });

    const headers = signer.signRequest({
      method: request.method,
      path: request.path,
      nonce: "nonce-123",
      body,
    });

    expect(headers).toMatchObject({
      "x-internal-service": "bot-service",
      "x-internal-timestamp": "1700000000000",
      "x-internal-nonce": "nonce-123",
      "x-internal-signature": "100f4e6dd761b1f6d628454dddc22f82d33d7bc76f6bf2717e7d6696ea43236c",
    });
  });

  it("uses bot-service intended internal scopes for bot-used operations", () => {
    const requestToScope = (path: string): string => {
      const segments = path.split("/").filter(Boolean);
      const [version, namespace, resource, action] = segments;

      if (version !== "v1" || namespace !== "internal" || !resource || !action) {
        throw new Error(`Unexpected internal operation path: ${path}`);
      }

      return `internal:${resource}:${action}`;
    };

    const notifyScope = requestToScope(postInternalNotifyDispatch().path);
    const checksScope = requestToScope(postInternalChecksLookup().path);

    expect([notifyScope, checksScope]).toContain("internal:notify:dispatch");
    expect([notifyScope, checksScope]).toContain("internal:checks:lookup");
    expect([notifyScope, checksScope]).not.toContain("internal:ingest:jobs");
  });

  it("registers command handler wired to generated internal checks lookup operation", async () => {
    const expectedResponse = new Response(null, { status: 200 });
    const sendMock: CommandHandlerDeps["internalApi"]["send"] = vi.fn().mockResolvedValue(expectedResponse);

    const deps: CommandHandlerDeps = {
      internalApi: {
        send: sendMock,
      },
    };

    const handlers = commandHandlers.registerCommandHandlers(deps);

    const payload = {
      userId: "123456",
      targetUserId: "789012",
    };

    const response = await handlers.runInternalChecksLookup(payload);

    expect(response).toBe(expectedResponse);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({
      request: postInternalChecksLookup(),
      body: payload,
    });
  });

  it("registers dispatch handler wired to generated internal notify operation", async () => {
    const expectedResponse = new Response(null, { status: 202 });
    const sendMock: NotificationHandlerDeps["internalApi"]["send"] = vi.fn().mockResolvedValue(expectedResponse);

    const deps: NotificationHandlerDeps = {
      internalApi: {
        send: sendMock,
      },
    };

    const handlers = notificationHandlers.registerNotificationHandlers(deps);

    const payload = {
      userId: "123456",
      channel: "discord",
      message: "Job match found",
    };

    const response = await handlers.dispatchInternalNotification(payload);

    expect(response).toBe(expectedResponse);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({
      request: postInternalNotifyDispatch(),
      body: payload,
    });
  });
});


describe("createInternalApiClient.send integration", () => {
  it("emits URL, method, auth headers, content-type, and JSON body for body requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));

    const client = createInternalApiClient({
      baseUrl: "https://api.rohunt.local",
      serviceId: "bot-service",
      secret: "test-secret",
      now: () => 1700000000000,
      createNonce: () => "nonce-123",
      fetch: fetchMock,
    });

    const request = postInternalNotifyDispatch();
    const body = {
      userId: "123456",
      channel: "discord",
      message: "Job match found",
    };

    await client.send({
      request,
      body,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    const expectedHeaders = createInternalApiSigner({
      serviceId: "bot-service",
      secret: "test-secret",
      now: () => 1700000000000,
    }).signRequest({
      method: request.method,
      path: request.path,
      nonce: "nonce-123",
      body: JSON.stringify(body),
    });

    expect(url).toBe("https://api.rohunt.local/v1/internal/notify/dispatch");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(body));
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("x-internal-service")).toBe(expectedHeaders["x-internal-service"]);
    expect(headers.get("x-internal-timestamp")).toBe(expectedHeaders["x-internal-timestamp"]);
    expect(headers.get("x-internal-nonce")).toBe(expectedHeaders["x-internal-nonce"]);
    expect(headers.get("x-internal-signature")).toBe(expectedHeaders["x-internal-signature"]);
  });

  it("rejects non-/v1/internal paths", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    const client = createInternalApiClient({
      baseUrl: "https://api.rohunt.local",
      serviceId: "bot-service",
      secret: "test-secret",
      fetch: fetchMock,
    });

    await expect(
      client.send({
        request: {
          method: "POST",
          path: "/v1/public/jobs",
        },
        body: {
          userId: "123456",
          channel: "discord",
          message: "Job match found",
        },
      })
    ).rejects.toThrow("Internal API client only supports /v1/internal/* operations: /v1/public/jobs");

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
describe("createBotApp internal API wiring", () => {
  const originalEnv = {
    INTERNAL_API_URL: process.env.INTERNAL_API_URL,
    INTERNAL_SERVICE_ID: process.env.INTERNAL_SERVICE_ID,
    INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET,
  };

  beforeEach(() => {
    process.env.INTERNAL_API_URL = originalEnv.INTERNAL_API_URL;
    process.env.INTERNAL_SERVICE_ID = originalEnv.INTERNAL_SERVICE_ID;
    process.env.INTERNAL_SERVICE_SECRET = originalEnv.INTERNAL_SERVICE_SECRET;
  });

  afterEach(() => {
    process.env.INTERNAL_API_URL = originalEnv.INTERNAL_API_URL;
    process.env.INTERNAL_SERVICE_ID = originalEnv.INTERNAL_SERVICE_ID;
    process.env.INTERNAL_SERVICE_SECRET = originalEnv.INTERNAL_SERVICE_SECRET;
    vi.restoreAllMocks();
  });

  it("fails fast with clear error when required internal API env vars are missing", () => {
    delete process.env.INTERNAL_API_URL;
    delete process.env.INTERNAL_SERVICE_ID;
    delete process.env.INTERNAL_SERVICE_SECRET;

    expect(() => createBotApp()).toThrowError(
      "Missing required environment variable(s): INTERNAL_API_URL, INTERNAL_SERVICE_ID, INTERNAL_SERVICE_SECRET"
    );
  });

  it("injects internalApi into command and notification handler registration", () => {
    process.env.INTERNAL_API_URL = "https://api.rohunt.local";
    process.env.INTERNAL_SERVICE_ID = "bot-service";
    process.env.INTERNAL_SERVICE_SECRET = "test-secret";

    const commandSpy = vi.spyOn(commandHandlers, "registerCommandHandlers");
    const notificationSpy = vi.spyOn(notificationHandlers, "registerNotificationHandlers");

    const app = createBotApp();

    expect(commandSpy).toHaveBeenCalledTimes(1);
    expect(notificationSpy).toHaveBeenCalledTimes(1);

    const commandDeps = commandSpy.mock.calls[0]?.[0];
    const notificationDeps = notificationSpy.mock.calls[0]?.[0];

    expect(commandDeps?.internalApi).toBe(app.internalApi);
    expect(notificationDeps?.internalApi).toBe(app.internalApi);
  });
});
