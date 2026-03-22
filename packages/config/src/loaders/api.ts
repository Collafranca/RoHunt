import { type ApiConfig, apiEnvSchema } from "../schema";

export function loadApiConfig(env: Record<string, string | undefined>): ApiConfig {
  return apiEnvSchema.parse({
    DATABASE_URL: env.DATABASE_URL,
    DISCORD_CLIENT_ID: env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: env.DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI: env.DISCORD_REDIRECT_URI,
    AI_API_KEY: env.AI_API_KEY,
    AI_MODEL: env.AI_MODEL,
    AI_BASE_URL: env.AI_BASE_URL,
    SENTRY_DSN: env.SENTRY_DSN,
  });
}
