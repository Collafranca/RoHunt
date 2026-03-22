import { type WebConfig, webEnvSchema } from "../schema";

export function loadWebConfig(env: Record<string, string | undefined>): WebConfig {
  return webEnvSchema.parse({
    PUBLIC_API_URL: env.PUBLIC_API_URL,
    SENTRY_DSN: env.SENTRY_DSN,
  });
}
