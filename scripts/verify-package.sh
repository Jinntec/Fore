#!/usr/bin/env bash
# Verifies that the published npm package can actually be consumed by a bundler,
# which is what https://github.com/Jinntec/Fore/issues/370 regressed on.
#
# It packs the package exactly as `npm publish` would, installs the tarball into a
# throwaway project, and runs `vite build` against the library's own documented
# entry points. A green run means `import '@jinntec/fore'` works out of the box.
#
# Usage: npm run verify:package
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

WORK_DIR="$(mktemp -d)"
TARBALL=""
cleanup() {
  [[ -n "$TARBALL" && -f "$ROOT_DIR/$TARBALL" ]] && rm -f "$ROOT_DIR/$TARBALL"
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

echo "== Building bundles =="
npm run build

echo "== Packing tarball =="
# --ignore-scripts: we already built above; don't run `prepare` again.
rm -f "$ROOT_DIR"/jinntec-fore-*.tgz
npm pack --ignore-scripts >/dev/null
TARBALL="$(cd "$ROOT_DIR" && ls -1 jinntec-fore-*.tgz)"
echo "Packed $TARBALL"

echo "== Static packaging lint (publint) =="
# Not --strict: the remaining advisories are about shipping ESM as `.js` without a
# top-level "type": "module", which bundlers (the supported consumers) handle fine.
# publint still fails the build on real errors: a subpath pointing at a missing file.
npx --yes publint@0.3

echo "== Setting up throwaway consumer project in $WORK_DIR =="
cd "$WORK_DIR"
npm init -y >/dev/null
npm install --no-audit --no-fund --silent "$ROOT_DIR/$TARBALL" vite@^7

cat > main.js <<'EOF'
// Every entry point the README/docs tell consumers to use.
import '@jinntec/fore';
import '@jinntec/fore/dev';
import '@jinntec/fore/dist/fore.js';
import '@jinntec/fore/dist/fore-dev.js';
import '@jinntec/fore/resources/fore.css';
EOF

cat > index.html <<'EOF'
<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>fore package smoke test</title></head>
  <body>
    <script type="module" src="/main.js"></script>
  </body>
</html>
EOF

echo "== vite build (bundler resolution + pre-transform) =="
npx vite build --logLevel warn

echo "== Node ESM resolution of every exported subpath =="
node --input-type=module <<'EOF'
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const specifiers = [
  '@jinntec/fore',
  '@jinntec/fore/dev',
  '@jinntec/fore/dist/fore.js',
  '@jinntec/fore/dist/fore-dev.js',
  '@jinntec/fore/resources/fore.css',
  '@jinntec/fore/resources/vars.css',
  '@jinntec/fore/resources/toastify.css',
  '@jinntec/fore/package.json',
];

let failed = 0;
for (const specifier of specifiers) {
  try {
    const resolved = fileURLToPath(import.meta.resolve(specifier));
    if (!existsSync(resolved)) {
      console.error(`  MISSING  ${specifier} -> ${resolved} (not in tarball)`);
      failed++;
    } else {
      console.log(`  ok       ${specifier}`);
    }
  } catch (error) {
    console.error(`  BLOCKED  ${specifier} -> ${error.message}`);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
EOF

echo
echo "== Package verified: bundler + Node resolution both succeed =="
