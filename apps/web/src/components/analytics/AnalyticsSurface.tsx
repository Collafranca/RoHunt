import type { SurfaceState } from "../../lib/api-client";

export function renderHomeState(state: SurfaceState<unknown[]>) {
  if (state.kind === "loading") {
    return { kind: "loading" as const, message: state.message || "Loading platform status...", items: [] as unknown[] };
  }

  if (state.kind === "error") {
    return { kind: "error" as const, message: state.message || "Could not load platform status.", items: [] as unknown[] };
  }

  if (state.kind === "empty") {
    return { kind: "empty" as const, message: state.message || "No platform status available.", items: [] as unknown[] };
  }

  return {
    kind: "data" as const,
    message: state.message,
    items: state.items,
  };
}

export function renderAnalyticsState(state: SurfaceState<unknown[]>) {
  if (state.kind === "loading") {
    return { kind: "loading" as const, message: state.message || "Loading analytics...", items: [] as unknown[] };
  }

  if (state.kind === "error") {
    return { kind: "error" as const, message: state.message || "Could not load analytics.", items: [] as unknown[] };
  }

  if (state.kind === "empty") {
    return { kind: "empty" as const, message: state.message || "No analytics available.", items: [] as unknown[] };
  }

  return {
    kind: "data" as const,
    message: state.message,
    items: state.items,
  };
}
