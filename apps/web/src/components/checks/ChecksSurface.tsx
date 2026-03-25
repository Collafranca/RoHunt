import type { SurfaceState } from "../../lib/api-client";

export function renderChecksState(state: SurfaceState<unknown[]>) {
  if (state.kind === "loading") {
    return { kind: "loading" as const, message: state.message || "Loading background checks...", items: [] as unknown[] };
  }

  if (state.kind === "error") {
    return { kind: "error" as const, message: state.message || "Could not load background checks.", items: [] as unknown[] };
  }

  if (state.kind === "empty") {
    return { kind: "empty" as const, message: state.message || "No background checks found.", items: [] as unknown[] };
  }

  return {
    kind: "data" as const,
    message: state.message,
    items: state.items,
  };
}
