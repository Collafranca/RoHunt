export type InternalServiceCredential = {
  readonly serviceId: string;
  readonly secret: string;
  readonly scopes: readonly string[];
};

type InternalServiceDefinition = {
  readonly serviceId: string;
  readonly secretEnvVarName: string;
  readonly scopes: readonly string[];
};

const INTERNAL_SERVICE_DEFINITIONS: ReadonlyMap<string, InternalServiceDefinition> = new Map([
  [
    "scraper-service",
    {
      serviceId: "scraper-service",
      secretEnvVarName: "INTERNAL_SCRAPER_SERVICE_SECRET",
      scopes: ["internal:health:read", "internal:ingest:jobs", "internal:checks:lookup"],
    },
  ],
  [
    "bot-service",
    {
      serviceId: "bot-service",
      secretEnvVarName: "INTERNAL_BOT_SERVICE_SECRET",
      scopes: ["internal:notify:dispatch", "internal:checks:lookup"],
    },
  ],
]);

function readSecretFromEnvironment(variableName: string): string | null {
  const secret = process.env[variableName]?.trim();

  if (!secret) {
    return null;
  }

  return secret;
}

export function getInternalServiceCredential(serviceId: string): InternalServiceCredential | null {
  const definition = INTERNAL_SERVICE_DEFINITIONS.get(serviceId);

  if (!definition) {
    return null;
  }

  const secret = readSecretFromEnvironment(definition.secretEnvVarName);

  if (!secret) {
    return null;
  }

  return {
    serviceId: definition.serviceId,
    secret,
    scopes: definition.scopes,
  };
}
