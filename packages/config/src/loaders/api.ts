import { type ApiConfig, apiEnvSchema } from "../schema";

export function loadApiConfig(env: Record<string, string | undefined>): ApiConfig {
  return apiEnvSchema.parse(env);
}
