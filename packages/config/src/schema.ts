import { z } from "zod";

const requiredString = z.string().min(1);
const optionalString = z.string().min(1).optional();
const requiredUrl = z.string().url();
const optionalUrl = z.string().url().optional();

export const apiEnvSchema = z
  .object({
    DATABASE_URL: requiredUrl,
    DISCORD_CLIENT_ID: requiredString,
    DISCORD_CLIENT_SECRET: requiredString,
    DISCORD_REDIRECT_URI: requiredUrl,
    AI_API_KEY: requiredString,
    AI_MODEL: requiredString,
    AI_BASE_URL: optionalUrl,
    SENTRY_DSN: optionalUrl,
  })
  .strict();

export const webEnvSchema = z
  .object({
    PUBLIC_API_URL: requiredUrl,
    SENTRY_DSN: optionalUrl,
  })
  .strict();

export const botEnvSchema = z
  .object({
    DISCORD_BOT_TOKEN: requiredString,
    INTERNAL_API_URL: requiredUrl,
    INTERNAL_SERVICE_ID: requiredString,
    INTERNAL_SERVICE_SECRET: requiredString,
    SENTRY_DSN: optionalUrl,
  })
  .strict();

export const scraperEnvSchema = z
  .object({
    SCRAPER_DISCORD_TOKEN: requiredString,
    INTERNAL_API_URL: requiredUrl,
    INTERNAL_SERVICE_ID: requiredString,
    INTERNAL_SERVICE_SECRET: requiredString,
    SENTRY_DSN: optionalUrl,
  })
  .strict();

export type ApiConfig = z.infer<typeof apiEnvSchema>;
export type WebConfig = z.infer<typeof webEnvSchema>;
export type BotConfig = z.infer<typeof botEnvSchema>;
export type ScraperConfig = z.infer<typeof scraperEnvSchema>;
