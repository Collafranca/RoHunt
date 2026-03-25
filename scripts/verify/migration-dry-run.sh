#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
MIGRATIONS_DIR="$ROOT/apps/api/migrations"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

[[ -d "$MIGRATIONS_DIR" ]] || fail "migration directory not found: $MIGRATIONS_DIR"
command -v bash >/dev/null 2>&1 || fail "bash is required"

shopt -s nullglob
migration_files=("$MIGRATIONS_DIR"/*.sql)
shopt -u nullglob

((${#migration_files[@]} > 0)) || fail "no migration files found"

last_file=''
for file in "${migration_files[@]}"; do
  name="$(basename "$file")"

  [[ "$name" =~ ^[0-9]{4}_[a-z0-9_]+\.sql$ ]] || fail "invalid migration filename: $name"

  if [[ -n "$last_file" && "$name" < "$last_file" ]]; then
    fail "migration order violation: $name is out of sequence"
  fi

  grep -Eq 'CREATE TABLE|ALTER TABLE|CREATE INDEX|CREATE EXTENSION|CREATE TYPE' "$file" || fail "migration appears empty of DDL statements: $name"
  grep -Eq 'DROP TABLE|DROP SCHEMA|TRUNCATE' "$file" && fail "destructive statement found in migration: $name"

  last_file="$name"
done

printf '[migration-dry-run] validated %d migration files\n' "${#migration_files[@]}"
printf '[migration-dry-run] PASS\n'
