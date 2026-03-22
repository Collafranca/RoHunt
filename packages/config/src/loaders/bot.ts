import { type BotConfig, botEnvSchema } from "../schema";

export function loadBotConfig(env: Record<string, string | undefined>): BotConfig {
  return botEnvSchema.parse({
    DISCORD_BOT_TOKEN: env.DISCORD_BOT_TOKEN,
    INTERNAL_API_URL: env.INTERNAL_API_URL,
    INTERNAL_SERVICE_ID: env.INTERNAL_SERVICE_ID,
    INTERNAL_SERVICE_SECRET: env.INTERNAL_SERVICE_SECRET,
    SENTRY_DSN: env.SENTRY_DSN,
  });
}
