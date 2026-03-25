#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

run_step() {
  local label="$1"
  shift
  printf '[staging-smoke] %s\n' "$label"
  "$@"
}

[[ -f "$ROOT/package.json" ]] || fail "must run from repository with package.json"
command -v pnpm >/dev/null 2>&1 || fail "pnpm is required"
command -v bash >/dev/null 2>&1 || fail "bash is required"

[[ -x "$ROOT/scripts/verify/verify-workspace.sh" ]] || fail "scripts/verify/verify-workspace.sh must be executable"
[[ -x "$ROOT/scripts/verify/migration-dry-run.sh" ]] || fail "scripts/verify/migration-dry-run.sh must be executable"
[[ -x "$ROOT/scripts/verify/core-e2e.sh" ]] || fail "scripts/verify/core-e2e.sh must be executable"

run_step "1/4 workspace structural verification" bash "$ROOT/scripts/verify/verify-workspace.sh"
run_step "2/4 migration dry run" bash "$ROOT/scripts/verify/migration-dry-run.sh"
run_step "3/4 API contract structural guard checks" pnpm --dir "$ROOT" --filter @rohunt/api exec vitest run --root "$ROOT" "apps/api/test/contracts/contract-snapshot.test.ts"
run_step "4/4 core web structural route guard checks" bash "$ROOT/scripts/verify/core-e2e.sh"

printf '[staging-smoke] PASS\n'
