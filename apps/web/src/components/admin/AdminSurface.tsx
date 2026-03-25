import type { SurfaceState } from "../../lib/api-client";

export function renderAdminState(state: SurfaceState<unknown[]>) {
  if (state.kind === "loading") {
    return { kind: "loading" as const, message: state.message || "Loading admin data...", items: [] as unknown[] };
  }

  if (state.kind === "error") {
    return { kind: "error" as const, message: state.message || "Could not load admin data.", items: [] as unknown[] };
  }

  if (state.kind === "empty") {
    return { kind: "empty" as const, message: state.message || "No admin records found.", items: [] as unknown[] };
  }

  return {
    kind: "data" as const,
    message: state.message,
    items: state.items,
  };
}
