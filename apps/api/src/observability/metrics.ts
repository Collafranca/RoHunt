type TelemetryPrimitive = string | number | boolean | null;

export type TelemetryPayload = {
  service: "api";
  event: string;
  timestamp: string;
  requestId?: string;
  attributes: Record<string, TelemetryPrimitive>;
};

export type TelemetryHook = (payload: TelemetryPayload) => void;

let telemetryHooks: TelemetryHook[] = [];

export function registerTelemetryHook(hook: TelemetryHook): () => void {
  telemetryHooks = [...telemetryHooks, hook];

  return () => {
    telemetryHooks = telemetryHooks.filter((candidate) => candidate !== hook);
  };
}

export function buildTelemetryPayload(input: {
  event: string;
  requestId?: string;
  attributes?: Record<string, TelemetryPrimitive>;
}): TelemetryPayload {
  return {
    service: "api",
    event: input.event,
    timestamp: new Date().toISOString(),
    requestId: input.requestId,
    attributes: input.attributes ?? {},
  };
}

export function emitTelemetry(input: {
  event: string;
  requestId?: string;
  attributes?: Record<string, TelemetryPrimitive>;
}): TelemetryPayload {
  const payload = buildTelemetryPayload(input);

  for (const hook of telemetryHooks) {
    try {
      hook(payload);
    } catch {
      // Observability hooks must never affect request flow.
    }
  }

  return payload;
}
