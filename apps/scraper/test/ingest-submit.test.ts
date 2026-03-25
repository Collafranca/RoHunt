import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { postInternalIngestJobs } from "../../../packages/contracts/src/generated/client";
import { createScraperIngestionFlow } from "../src/index";
import { createIngestIdempotencyKey } from "../src/parsers/ingest";
import { createInternalApiClient } from "../src/internal-api/client";
import type { DiscordSourceMessage } from "../src/sources/discord";

describe("scraper ingest submit", () => {
  it("builds normalized payload and submits ingest request", async () => {
    const send = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));

    const flow = createScraperIngestionFlow({
      internalApi: {
        send,
      },
    });

    const sourceMessage: DiscordSourceMessage = {
      messageId: "msg-123",
      channelId: "channel-9",
      guildId: "guild-3",
      authorId: "user-7",
      content: "  Hiring Roblox scripter  ",
      postedAt: "2026-03-25T00:00:00.000Z",
    };

    await flow.submitDiscordMessage(sourceMessage);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({
      request: postInternalIngestJobs(),
      idempotencyKey: createIngestIdempotencyKey(sourceMessage),
      body: {
        source: "discord",
        sourceMessageId: "msg-123",
        normalizedPayload: {
          source: "discord",
          sourceMessageId: "msg-123",
          sourceChannelId: "channel-9",
          sourceGuildId: "guild-3",
          authorId: "user-7",
          content: "Hiring Roblox scripter",
          postedAt: "2026-03-25T00:00:00.000Z",
        },
      },
    });
  });

  it("signs internal ingest requests with canonical internal auth headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));

    const client = createInternalApiClient({
      baseUrl: "https://api.rohunt.local",
      serviceId: "scraper-service",
      secret: "test-secret",
      now: () => 1700000000000,
      createNonce: () => "nonce-123",
      fetch: fetchMock,
    });

    const request = postInternalIngestJobs();
    const body = {
      source: "discord",
      sourceMessageId: "msg-123",
      normalizedPayload: {
        source: "discord",
        sourceMessageId: "msg-123",
        sourceChannelId: "channel-9",
        sourceGuildId: "guild-3",
        authorId: "user-7",
        content: "Hiring Roblox scripter",
        postedAt: "2026-03-25T00:00:00.000Z",
      },
    };

    await client.send({
      request,
      body,
      idempotencyKey: "ingest:test-key",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    const serializedBody = JSON.stringify(body);
    const expectedTimestamp = "1700000000000";
    const expectedNonce = "nonce-123";
    const expectedCanonical = `${request.method}\n${request.path}\n${expectedTimestamp}\n${expectedNonce}\n${serializedBody}`;
    const expectedSignature = createHmac("sha256", "test-secret").update(expectedCanonical).digest("hex");

    expect(url).toBe("https://api.rohunt.local/v1/internal/ingest/jobs");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(serializedBody);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("x-idempotency-key")).toBe("ingest:test-key");
    expect(headers.get("x-internal-service")).toBe("scraper-service");
    expect(headers.get("x-internal-timestamp")).toBe(expectedTimestamp);
    expect(headers.get("x-internal-nonce")).toBe(expectedNonce);
    expect(headers.get("x-internal-signature")).toBe(expectedSignature);
  });

  it("rejects hostile internal path variants", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));

    const client = createInternalApiClient({
      baseUrl: "https://api.rohunt.local",
      serviceId: "scraper-service",
      secret: "test-secret",
      now: () => 1700000000000,
      createNonce: () => "nonce-123",
      fetch: fetchMock,
    });

    const baseRequest = postInternalIngestJobs();
    const body = {
      source: "discord" as const,
      sourceMessageId: "msg-123",
      normalizedPayload: {
        source: "discord" as const,
        sourceMessageId: "msg-123",
        sourceChannelId: "channel-9",
        sourceGuildId: "guild-3",
        authorId: "user-7",
        content: "Hiring Roblox scripter",
        postedAt: "2026-03-25T00:00:00.000Z",
      },
    };

    const hostilePaths = [
      "/v1/internal/../ingest/jobs",
      "/v1/internal/%2e%2e/ingest/jobs",
      "/v1/internal/%252e%252e/ingest/jobs",
      "/v1/internal/ingest%2fjobs",
      "/v1/internal/ingest%252fjobs",
      "/v1/internal/ingest%5cjobs",
      "/v1/internal/ingest%255cjobs",
      "/v1/internal/ingest\\jobs",
    ];

    for (const path of hostilePaths) {
      await expect(
        client.send({
          request: {
            ...baseRequest,
            path,
          },
          body,
          idempotencyKey: `ingest:test-key:${path}`,
        }),
      ).rejects.toThrowError(/Internal API client rejected unsafe path|Internal API client rejected unsafe path traversal/);
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates deterministic idempotency keys from source identity", () => {
    const base: DiscordSourceMessage = {
      messageId: "msg-123",
      channelId: "channel-9",
      guildId: "guild-3",
      authorId: "user-7",
      content: "Hiring Roblox scripter",
      postedAt: "2026-03-25T00:00:00.000Z",
    };

    const sameIdentity = {
      ...base,
      content: "  Hiring Roblox scripter  ",
    };

    const differentMessage = {
      ...base,
      messageId: "msg-124",
    };

    expect(createIngestIdempotencyKey(base)).toBe(createIngestIdempotencyKey(sameIdentity));
    expect(createIngestIdempotencyKey(base)).not.toBe(createIngestIdempotencyKey(differentMessage));
  });
});
