#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

[[ -f "$ROOT/package.json" ]] || fail "must run from repository root"
command -v pnpm >/dev/null 2>&1 || fail "pnpm is required"

printf '[core-route-guards] running core web route guard checks\n'
pnpm --dir "$ROOT" --filter @rohunt/web exec vitest run --root "$ROOT" "apps/web/test/e2e/core-journeys.spec.ts"
printf '[core-route-guards] PASS\n'
