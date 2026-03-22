import { type ScraperConfig, scraperEnvSchema } from "../schema";

export function loadScraperConfig(
  env: Record<string, string | undefined>,
): ScraperConfig {
  return scraperEnvSchema.parse(env);
}
