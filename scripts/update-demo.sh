#!/usr/bin/env bash
# Automates doc/how-to-release.md "updating demo site" section.
# Usage: npm run release:demo
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

confirm() {
  local prompt="$1"
  read -r -p "$prompt [y/N] " reply
  if [[ ! "$reply" =~ ^[Yy]$ ]]; then
    echo "Aborted." >&2
    exit 1
  fi
}

ORIGINAL_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
SWITCHED=0
on_error() {
  local code=$?
  if [[ "$SWITCHED" == "1" ]]; then
    echo "Error — returning to '$ORIGINAL_BRANCH' branch." >&2
    git checkout "$ORIGINAL_BRANCH"
  fi
  exit "$code"
}
trap on_error ERR

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash changes first." >&2
  git status --short
  exit 1
fi

echo "Fetching origin..."
git fetch origin

echo "== Switching to demo branch =="
SWITCHED=1
git checkout demo
git pull origin demo

echo "== Merging dev into demo =="
echo "(demo/demo.js, demo/demo-build.js, vite.build-dev.config.js are protected via .gitattributes merge=ours)"
premerge_rev="$(git rev-parse HEAD)"
git merge dev --no-edit

echo
echo "== Files changed by the merge =="
git diff --stat "$premerge_rev" HEAD -- demo/package.json demo/demo.js demo/demo-build.js vite.build-dev.config.js || true
echo
echo "If third-party demo dependencies changed, edit demo/package.json / demo/demo.js now,"
echo "in another terminal, before continuing."
confirm "Continue with the demo build?"

if ! git diff --quiet "$premerge_rev" HEAD -- demo/package.json; then
  echo "== demo/package.json changed, reinstalling demo deps =="
  npm run install-demos
fi

echo "== Building demo bundle (dist/fore.js, dist/demo.js) =="
npm run build

echo
echo "== Resulting changes =="
git status --short
git diff --stat

if [[ -z "$(git status --porcelain)" ]]; then
  echo "No changes to commit."
else
  confirm "Commit and push the demo branch update?"
  git add -A
  git commit -m "chore: update demo site"
  git push origin demo
fi

git checkout "$ORIGINAL_BRANCH"
SWITCHED=0

echo
echo "== Demo site update complete =="
echo "GitHub Pages will republish automatically from the demo branch."