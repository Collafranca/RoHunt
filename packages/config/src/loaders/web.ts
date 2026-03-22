import { type WebConfig, webEnvSchema } from "../schema";

export function loadWebConfig(env: Record<string, string | undefined>): WebConfig {
  return webEnvSchema.parse(env);
}
