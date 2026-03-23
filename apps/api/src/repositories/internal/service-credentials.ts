export type InternalServiceCredential = {
  readonly serviceId: string;
  readonly secret: string;
  readonly scopes: readonly string[];
};

const INTERNAL_SERVICE_CREDENTIALS: ReadonlyMap<string, InternalServiceCredential> = new Map([
  [
    "scraper-service",
    {
      serviceId: "scraper-service",
      secret: "scraper-service-secret-v1",
      scopes: ["internal:ingest:jobs", "internal:checks:lookup"],
    },
  ],
  [
    "bot-service",
    {
      serviceId: "bot-service",
      secret: "bot-service-secret-v1",
      scopes: ["internal:notify:dispatch", "internal:checks:lookup"],
    },
  ],
]);

export function getInternalServiceCredential(serviceId: string): InternalServiceCredential | null {
  return INTERNAL_SERVICE_CREDENTIALS.get(serviceId) ?? null;
}
