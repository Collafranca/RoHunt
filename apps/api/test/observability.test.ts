import { describe, expect, it } from "vitest";

import { logRequestCompleted, logRequestFailed, setLoggerSink } from "../src/observability/logging";
import { buildTelemetryPayload, emitTelemetry, registerTelemetryHook } from "../src/observability/metrics";
import { captureException, registerErrorCaptureHook } from "../src/observability/sentry";

describe("observability instrumentation", () => {
  it("includes request id in request completion logs", () => {
    const entries: unknown[] = [];
    const restoreLoggerSink = setLoggerSink((entry) => {
      entries.push(entry);
    });

    try {
      const entry = logRequestCompleted({
        requestId: "req-obsv-123",
        method: "GET",
        path: "/v1/public/health",
        status: 200,
        durationMs: 12,
      });

      expect(entry.requestId).toBe("req-obsv-123");
      expect(entry.message).toBe("request.completed");
      expect(entries).toEqual([entry]);
    } finally {
      restoreLoggerSink();
    }
  });

  it("captures exceptions through registered hooks", () => {
    const captures: unknown[] = [];
    const unregister = registerErrorCaptureHook((payload) => {
      captures.push(payload);
    });

    try {
      const payload = captureException(new Error("boom"), {
        requestId: "req-obsv-error",
        tags: {
          route: "/v1/public/health",
        },
      });

      expect(payload.service).toBe("api");
      expect(payload.requestId).toBe("req-obsv-error");
      expect(payload.error).toEqual({
        name: "Error",
        message: "boom",
      });
      expect(payload.tags).toEqual({
        route: "/v1/public/health",
      });
      expect(captures).toEqual([payload]);
    } finally {
      unregister();
    }
  });


  it("isolates logger sink failures from request flow", () => {
    const restoreLoggerSink = setLoggerSink(() => {
      throw new Error("sink exploded");
    });

    try {
      expect(() =>
        logRequestCompleted({
          requestId: "req-obsv-safe-log",
          method: "GET",
          path: "/v1/public/health",
          status: 200,
          durationMs: 5,
        }),
      ).not.toThrow();

      const failedEntry = logRequestFailed({
        requestId: "req-obsv-safe-log-failed",
        method: "POST",
        path: "/v1/private/jobs",
        status: 500,
        durationMs: 9,
        error: new Error("boom"),
      });

      expect(failedEntry.message).toBe("request.failed");
      expect(failedEntry.requestId).toBe("req-obsv-safe-log-failed");
    } finally {
      restoreLoggerSink();
    }
  });

  it("isolates exception hook failures from request flow", () => {
    const captures: unknown[] = [];
    const unregisterThrowing = registerErrorCaptureHook(() => {
      throw new Error("capture hook exploded");
    });
    const unregisterHealthy = registerErrorCaptureHook((payload) => {
      captures.push(payload);
    });

    try {
      const payload = captureException(new Error("boom"), {
        requestId: "req-obsv-safe-capture",
        tags: {
          route: "/v1/public/health",
        },
      });

      expect(payload.requestId).toBe("req-obsv-safe-capture");
      expect(captures).toEqual([payload]);
    } finally {
      unregisterHealthy();
      unregisterThrowing();
    }
  });

  it("isolates telemetry hook failures from request flow", () => {
    const events: unknown[] = [];
    const unregisterThrowing = registerTelemetryHook(() => {
      throw new Error("telemetry hook exploded");
    });
    const unregisterHealthy = registerTelemetryHook((payload) => {
      events.push(payload);
    });

    try {
      const emitted = emitTelemetry({
        event: "request.completed",
        requestId: "req-obsv-safe-telemetry",
        attributes: {
          status: 200,
        },
      });

      expect(emitted.event).toBe("request.completed");
      expect(events).toEqual([emitted]);
    } finally {
      unregisterHealthy();
      unregisterThrowing();
    }
  });
});
