#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
TARGET="$ROOT/scripts/verify-workspace.sh"

# Wrapper entrypoint for on-call usage; canonical checks live in scripts/verify-workspace.sh.
if [[ ! -x "$TARGET" ]]; then
  printf 'ERROR: %s\n' "scripts/verify-workspace.sh must exist and be executable" >&2
  exit 1
fi

printf '[verify-workspace] delegating to scripts/verify-workspace.sh\n'
cd "$ROOT"
exec bash "$TARGET"
