import { type ScraperConfig, scraperEnvSchema } from "../schema";

export function loadScraperConfig(
  env: Record<string, string | undefined>,
): ScraperConfig {
  return scraperEnvSchema.parse({
    SCRAPER_DISCORD_TOKEN: env.SCRAPER_DISCORD_TOKEN,
    INTERNAL_API_URL: env.INTERNAL_API_URL,
    INTERNAL_SERVICE_ID: env.INTERNAL_SERVICE_ID,
    INTERNAL_SERVICE_SECRET: env.INTERNAL_SERVICE_SECRET,
    SENTRY_DSN: env.SENTRY_DSN,
  });
}
