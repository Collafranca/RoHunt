export type ErrorCapturePayload = {
  service: "api";
  timestamp: string;
  requestId?: string;
  error: {
    name: string;
    message: string;
  };
  tags: Record<string, string>;
};

export type ErrorCaptureHook = (payload: ErrorCapturePayload) => void;

let errorCaptureHooks: ErrorCaptureHook[] = [];

export function registerErrorCaptureHook(hook: ErrorCaptureHook): () => void {
  errorCaptureHooks = [...errorCaptureHooks, hook];

  return () => {
    errorCaptureHooks = errorCaptureHooks.filter((candidate) => candidate !== hook);
  };
}

export function captureException(error: unknown, options?: { requestId?: string; tags?: Record<string, string> }): ErrorCapturePayload {
  const normalizedError = error instanceof Error ? error : new Error(String(error));

  const payload: ErrorCapturePayload = {
    service: "api",
    timestamp: new Date().toISOString(),
    requestId: options?.requestId,
    error: {
      name: normalizedError.name,
      message: normalizedError.message,
    },
    tags: options?.tags ?? {},
  };

  for (const hook of errorCaptureHooks) {
    try {
      hook(payload);
    } catch {
      // Observability hooks must never affect request flow.
    }
  }

  return payload;
}
