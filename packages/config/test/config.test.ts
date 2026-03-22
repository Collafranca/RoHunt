import { describe, expect, it } from "vitest";
import {
  loadApiConfig,
  loadBotConfig,
  loadScraperConfig,
  loadWebConfig,
} from "../src/index";

describe("@rohunt/config loaders", () => {
  it("fails when API required vars are missing", () => {
    expect(() => loadApiConfig({})).toThrow();
  });

  it("parses valid API env", () => {
    const config = loadApiConfig({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      DISCORD_CLIENT_ID: "client-id",
      DISCORD_CLIENT_SECRET: "client-secret",
      DISCORD_REDIRECT_URI: "https://example.com/callback",
      AI_API_KEY: "key",
      AI_MODEL: "gpt-x",
      AI_BASE_URL: "https://api.example.com",
      SENTRY_DSN: "https://dsn.example.com",
    });

    expect(config).toEqual({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      DISCORD_CLIENT_ID: "client-id",
      DISCORD_CLIENT_SECRET: "client-secret",
      DISCORD_REDIRECT_URI: "https://example.com/callback",
      AI_API_KEY: "key",
      AI_MODEL: "gpt-x",
      AI_BASE_URL: "https://api.example.com",
      SENTRY_DSN: "https://dsn.example.com",
    });
  });

  it("fails when Web required vars are missing", () => {
    expect(() => loadWebConfig({})).toThrow();
  });

  it("parses valid Web env", () => {
    const config = loadWebConfig({
      PUBLIC_API_URL: "https://api.example.com",
      SENTRY_DSN: "https://dsn.example.com",
    });

    expect(config).toEqual({
      PUBLIC_API_URL: "https://api.example.com",
      SENTRY_DSN: "https://dsn.example.com",
    });
  });

  it("fails when Bot required vars are missing", () => {
    expect(() => loadBotConfig({})).toThrow();
  });

  it("parses valid Bot env", () => {
    const config = loadBotConfig({
      DISCORD_BOT_TOKEN: "discord-token",
      INTERNAL_API_URL: "https://internal-api.example.com",
      INTERNAL_SERVICE_ID: "service-id",
      INTERNAL_SERVICE_SECRET: "service-secret",
      SENTRY_DSN: "https://dsn.example.com",
    });

    expect(config).toEqual({
      DISCORD_BOT_TOKEN: "discord-token",
      INTERNAL_API_URL: "https://internal-api.example.com",
      INTERNAL_SERVICE_ID: "service-id",
      INTERNAL_SERVICE_SECRET: "service-secret",
      SENTRY_DSN: "https://dsn.example.com",
    });
  });

  it("fails when Scraper required vars are missing", () => {
    expect(() => loadScraperConfig({})).toThrow();
  });

  it("parses valid Scraper env", () => {
    const config = loadScraperConfig({
      SCRAPER_DISCORD_TOKEN: "scraper-token",
      INTERNAL_API_URL: "https://internal-api.example.com",
      INTERNAL_SERVICE_ID: "service-id",
      INTERNAL_SERVICE_SECRET: "service-secret",
      SENTRY_DSN: "https://dsn.example.com",
    });

    expect(config).toEqual({
      SCRAPER_DISCORD_TOKEN: "scraper-token",
      INTERNAL_API_URL: "https://internal-api.example.com",
      INTERNAL_SERVICE_ID: "service-id",
      INTERNAL_SERVICE_SECRET: "service-secret",
      SENTRY_DSN: "https://dsn.example.com",
    });
  });
});
