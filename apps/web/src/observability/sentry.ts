type ServiceSentryConfig = {
  service: "web";
  enabled: boolean;
  dsn: string | null;
  environment: string;
  release: string | null;
};

type WebSentryEnv = {
  readonly SENTRY_DSN?: string;
  readonly PUBLIC_SENTRY_DSN?: string;
  readonly NODE_ENV?: string;
  readonly SENTRY_ENVIRONMENT?: string;
  readonly SENTRY_RELEASE?: string;
  readonly PUBLIC_SENTRY_RELEASE?: string;
};

export function initSentry(env: WebSentryEnv = {}): ServiceSentryConfig {
  const dsn = env.SENTRY_DSN ?? env.PUBLIC_SENTRY_DSN ?? null;

  return {
    service: "web",
    enabled: typeof dsn === "string" && dsn.length > 0,
    dsn,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV ?? "development",
    release: env.SENTRY_RELEASE ?? env.PUBLIC_SENTRY_RELEASE ?? null,
  };
}
