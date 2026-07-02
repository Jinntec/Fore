#!/usr/bin/env bash
# Automates doc/how-to-release.md "Release" section.
# Usage: npm run release -- patch|minor|major
set -euo pipefail

BUMP="${1:-}"
if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Usage: npm run release -- patch|minor|major" >&2
  exit 1
fi

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

STARTED_MASTER_SWITCH=0
on_error() {
  local code=$?
  if [[ "$STARTED_MASTER_SWITCH" == "1" ]]; then
    echo "Error during master merge — returning to dev branch." >&2
    git checkout dev
  fi
  exit "$code"
}
trap on_error ERR

echo "== Preflight checks =="

current_branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current_branch" != "dev" ]]; then
  echo "Must be on 'dev' branch (currently on '$current_branch')." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash changes first." >&2
  git status --short
  exit 1
fi

echo "Fetching origin/dev..."
git fetch origin dev
local_rev="$(git rev-parse dev)"
remote_rev="$(git rev-parse origin/dev)"
base_rev="$(git merge-base dev origin/dev)"
if [[ "$local_rev" != "$remote_rev" ]]; then
  if [[ "$base_rev" == "$local_rev" ]]; then
    echo "Local dev is behind origin/dev. Pull first." >&2
  else
    echo "Local dev has diverged from origin/dev. Resolve before releasing." >&2
  fi
  exit 1
fi

echo "Checking npm auth..."
if ! npm whoami >/dev/null 2>&1; then
  echo "Not logged in to npm. Run 'npm login' first." >&2
  exit 1
fi
npm ping >/dev/null

current_version="$(node -p "require('./package.json').version")"
echo
echo "Current version: $current_version"
echo "Bump type:       $BUMP"
confirm "Proceed with this release?"

echo "== npm version $BUMP (runs tests, bumps, commits, tags) =="
npm version "$BUMP"

new_version="$(node -p "require('./package.json').version")"
TAG="v$new_version"

echo "== Pushing dev branch =="
git push origin dev

confirm "Push tag $TAG to origin?"
git push origin --tags

confirm "Publish $new_version to npm now? (you'll be prompted for your npm OTP)"
npm publish --access public

echo "== Creating GitHub release $TAG with auto-generated notes =="
gh release create "$TAG" --generate-notes

release_url="$(gh release view "$TAG" --json url -q .url)"

confirm "Merge dev into master and push?"
STARTED_MASTER_SWITCH=1
git checkout master
git pull origin master
git merge dev --no-edit
git push origin master
git checkout dev
STARTED_MASTER_SWITCH=0

echo
echo "== Release $TAG complete =="
echo "npm:     https://www.npmjs.com/package/@jinntec/fore/v/$new_version"
echo "GitHub:  $release_url"
echo
echo "Next: run 'npm run release:demo' to update the demo site."