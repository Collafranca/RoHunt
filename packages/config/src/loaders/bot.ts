import { type BotConfig, botEnvSchema } from "../schema";

export function loadBotConfig(env: Record<string, string | undefined>): BotConfig {
  return botEnvSchema.parse(env);
}
