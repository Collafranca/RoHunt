import { describe, expect, it } from "vitest";
import { ZodError, type ZodIssue } from "zod";
import {
  loadApiConfig,
  loadBotConfig,
  loadScraperConfig,
  loadWebConfig,
} from "../src/index";

function getZodIssues(fn: () => unknown): ZodIssue[] {
  try {
    fn();
    throw new Error("Expected config parsing to throw");
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
    return (error as ZodError).issues;
  }
}

describe("@rohunt/config loaders", () => {
  it("fails when API required vars are missing", () => {
    const issues = getZodIssues(() => loadApiConfig({}));

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["DATABASE_URL"],
          message: "Required",
        }),
        expect.objectContaining({
          path: ["DISCORD_CLIENT_ID"],
          message: "Required",
        }),
      ]),
    );
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

  it("parses API env when optional vars are omitted", () => {
    const config = loadApiConfig({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      DISCORD_CLIENT_ID: "client-id",
      DISCORD_CLIENT_SECRET: "client-secret",
      DISCORD_REDIRECT_URI: "https://example.com/callback",
      AI_API_KEY: "key",
      AI_MODEL: "gpt-x",
    });

    expect(config).toEqual({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      DISCORD_CLIENT_ID: "client-id",
      DISCORD_CLIENT_SECRET: "client-secret",
      DISCORD_REDIRECT_URI: "https://example.com/callback",
      AI_API_KEY: "key",
      AI_MODEL: "gpt-x",
    });
  });

  it("ignores unrelated process.env-like keys", () => {
    const config = loadApiConfig({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      DISCORD_CLIENT_ID: "client-id",
      DISCORD_CLIENT_SECRET: "client-secret",
      DISCORD_REDIRECT_URI: "https://example.com/callback",
      AI_API_KEY: "key",
      AI_MODEL: "gpt-x",
      NODE_ENV: "development",
      PATH: "/usr/local/bin",
      HOME: "/home/test",
    });

    expect(config).toEqual({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      DISCORD_CLIENT_ID: "client-id",
      DISCORD_CLIENT_SECRET: "client-secret",
      DISCORD_REDIRECT_URI: "https://example.com/callback",
      AI_API_KEY: "key",
      AI_MODEL: "gpt-x",
    });
  });

  it("fails when optional API vars are empty strings", () => {
    const issues = getZodIssues(() =>
      loadApiConfig({
        DATABASE_URL: "postgres://user:pass@localhost:5432/db",
        DISCORD_CLIENT_ID: "client-id",
        DISCORD_CLIENT_SECRET: "client-secret",
        DISCORD_REDIRECT_URI: "https://example.com/callback",
        AI_API_KEY: "key",
        AI_MODEL: "gpt-x",
        AI_BASE_URL: "",
        SENTRY_DSN: "",
      }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["AI_BASE_URL"],
          message: "Invalid url",
        }),
        expect.objectContaining({
          path: ["SENTRY_DSN"],
          message: "Invalid url",
        }),
      ]),
    );
  });

  it("fails when Web required vars are missing", () => {
    const issues = getZodIssues(() => loadWebConfig({}));

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["PUBLIC_API_URL"],
          message: "Required",
        }),
      ]),
    );
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
    const issues = getZodIssues(() => loadBotConfig({}));

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["DISCORD_BOT_TOKEN"],
          message: "Required",
        }),
      ]),
    );
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
    const issues = getZodIssues(() => loadScraperConfig({}));

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["SCRAPER_DISCORD_TOKEN"],
          message: "Required",
        }),
      ]),
    );
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
