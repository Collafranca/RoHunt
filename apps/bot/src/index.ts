import { createInternalApiClient } from "./internal-api/client";
import { registerCommandHandlers } from "./handlers/commands";
import { registerNotificationHandlers } from "./handlers/notifications";

type InternalApiEnv = {
  readonly INTERNAL_API_URL: string;
  readonly INTERNAL_SERVICE_ID: string;
  readonly INTERNAL_SERVICE_SECRET: string;
};

function getRequiredInternalApiEnv(): InternalApiEnv {
  const requiredVars = ["INTERNAL_API_URL", "INTERNAL_SERVICE_ID", "INTERNAL_SERVICE_SECRET"] as const;
  const missingVars = requiredVars.filter((name) => !process.env[name]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missingVars.join(", ")}`);
  }

  return {
    INTERNAL_API_URL: process.env.INTERNAL_API_URL!,
    INTERNAL_SERVICE_ID: process.env.INTERNAL_SERVICE_ID!,
    INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET!,
  };
}

export function createBotApp() {
  const env = getRequiredInternalApiEnv();

  const internalApi = createInternalApiClient({
    baseUrl: env.INTERNAL_API_URL,
    serviceId: env.INTERNAL_SERVICE_ID,
    secret: env.INTERNAL_SERVICE_SECRET,
  });

  registerCommandHandlers({ internalApi });
  registerNotificationHandlers({ internalApi });

  return {
    internalApi,
  };
}
