export type LogLevel = "info" | "warn" | "error";

export type LogEntry = {
  level: LogLevel;
  message: string;
  service: "api";
  timestamp: string;
  requestId?: string;
  context?: Record<string, unknown>;
};

export type LoggerSink = (entry: LogEntry) => void;

type RequestLogInput = {
  requestId?: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
};

let loggerSink: LoggerSink = (entry) => {
  const sink = entry.level === "error" ? console.error : console.log;
  sink(JSON.stringify(entry));
};

export function setLoggerSink(sink: LoggerSink): () => void {
  const previous = loggerSink;
  loggerSink = sink;

  return () => {
    loggerSink = previous;
  };
}

function safeWriteLog(entry: LogEntry): void {
  try {
    loggerSink(entry);
  } catch {
    // Logger sink failures must never affect request flow.
  }
}

export function logRequestCompleted(input: RequestLogInput): LogEntry {
  const entry: LogEntry = {
    level: "info",
    message: "request.completed",
    service: "api",
    timestamp: new Date().toISOString(),
    requestId: input.requestId,
    context: {
      method: input.method,
      path: input.path,
      status: input.status,
      durationMs: input.durationMs,
    },
  };

  safeWriteLog(entry);

  return entry;
}

export function logRequestFailed(input: RequestLogInput & { error: unknown }): LogEntry {
  const error = input.error instanceof Error ? input.error : new Error(String(input.error));

  const entry: LogEntry = {
    level: "error",
    message: "request.failed",
    service: "api",
    timestamp: new Date().toISOString(),
    requestId: input.requestId,
    context: {
      method: input.method,
      path: input.path,
      status: input.status,
      durationMs: input.durationMs,
      errorName: error.name,
      errorMessage: error.message,
    },
  };

  safeWriteLog(entry);

  return entry;
}
