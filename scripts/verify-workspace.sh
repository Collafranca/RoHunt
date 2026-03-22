#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"

required_files=(
  "pnpm-workspace.yaml"
  "package.json"
  "tsconfig.base.json"
  ".editorconfig"
  ".gitignore"
  ".env.example"
  "apps/api/package.json"
  "apps/web/package.json"
  "apps/bot/package.json"
  "apps/scraper/package.json"
  "packages/contracts/package.json"
  "packages/domain/package.json"
  "packages/config/package.json"
  "packages/ui/package.json"
)

missing=0
for file in "${required_files[@]}"; do
  if [[ ! -f "$ROOT/$file" ]]; then
    printf 'Missing required file: %s\n' "$file"
    missing=1
  fi
done

if [[ $missing -ne 0 ]]; then
  exit 1
fi

ROOT="$ROOT" node <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.env.ROOT;

const expected = [
  { file: 'apps/api/package.json', name: '@rohunt/api' },
  { file: 'apps/web/package.json', name: '@rohunt/web' },
  { file: 'apps/bot/package.json', name: '@rohunt/bot' },
  { file: 'apps/scraper/package.json', name: '@rohunt/scraper' },
  { file: 'packages/contracts/package.json', name: '@rohunt/contracts' },
  { file: 'packages/domain/package.json', name: '@rohunt/domain' },
  { file: 'packages/config/package.json', name: '@rohunt/config' },
  { file: 'packages/ui/package.json', name: '@rohunt/ui' }
];

let ok = true;
for (const pkg of expected) {
  const p = path.join(root, pkg.file);
  const json = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (json.name !== pkg.name) {
    console.error(`Invalid package name in ${pkg.file}: expected ${pkg.name}, got ${json.name}`);
    ok = false;
  }
  for (const script of ['lint', 'typecheck', 'test']) {
    if (!json.scripts || typeof json.scripts[script] !== 'string' || !json.scripts[script].trim()) {
      console.error(`Missing script '${script}' in ${pkg.file}`);
      ok = false;
    }
  }
}

if (!ok) process.exit(1);
console.log('Workspace smoke check passed.');
NODE
