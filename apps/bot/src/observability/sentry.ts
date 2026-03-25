type ServiceSentryConfig = {
  service: "bot";
  enabled: boolean;
  dsn: string | null;
  environment: string;
  release: string | null;
};

type BotSentryEnv = {
  readonly SENTRY_DSN?: string;
  readonly NODE_ENV?: string;
  readonly SENTRY_ENVIRONMENT?: string;
  readonly SENTRY_RELEASE?: string;
};

export function initSentry(env: BotSentryEnv = process.env): ServiceSentryConfig {
  const dsn = env.SENTRY_DSN ?? null;

  return {
    service: "bot",
    enabled: typeof dsn === "string" && dsn.length > 0,
    dsn,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV ?? "development",
    release: env.SENTRY_RELEASE ?? null,
  };
}
