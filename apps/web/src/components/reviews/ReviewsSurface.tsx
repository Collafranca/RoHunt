import type { SurfaceState } from "../../lib/api-client";

export function renderReviewsState(state: SurfaceState<unknown[]>) {
  if (state.kind === "loading") {
    return { kind: "loading" as const, message: state.message || "Loading reviews...", items: [] as unknown[] };
  }

  if (state.kind === "error") {
    return { kind: "error" as const, message: state.message || "Could not load reviews.", items: [] as unknown[] };
  }

  if (state.kind === "empty") {
    return { kind: "empty" as const, message: state.message || "No reviews found.", items: [] as unknown[] };
  }

  return {
    kind: "data" as const,
    message: state.message,
    items: state.items,
  };
}
