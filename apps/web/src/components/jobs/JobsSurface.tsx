import type { SurfaceState } from "../../lib/api-client";

export function renderJobsState(state: SurfaceState<unknown[]>) {
  if (state.kind === "loading") {
    return { kind: "loading" as const, message: state.message || "Loading jobs...", items: [] as unknown[] };
  }

  if (state.kind === "error") {
    return { kind: "error" as const, message: state.message || "Could not load jobs.", items: [] as unknown[] };
  }

  if (state.kind === "empty") {
    return { kind: "empty" as const, message: state.message || "No jobs found.", items: [] as unknown[] };
  }

  return {
    kind: "data" as const,
    message: state.message,
    items: state.items,
  };
}
