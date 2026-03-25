type ServiceSentryConfig = {
  service: "scraper";
  enabled: boolean;
  dsn: string | null;
  environment: string;
  release: string | null;
};

type ScraperSentryEnv = {
  readonly SENTRY_DSN?: string;
  readonly NODE_ENV?: string;
  readonly SENTRY_ENVIRONMENT?: string;
  readonly SENTRY_RELEASE?: string;
};

export function initSentry(env: ScraperSentryEnv = process.env): ServiceSentryConfig {
  const dsn = env.SENTRY_DSN ?? null;

  return {
    service: "scraper",
    enabled: typeof dsn === "string" && dsn.length > 0,
    dsn,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV ?? "development",
    release: env.SENTRY_RELEASE ?? null,
  };
}
