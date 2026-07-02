# how to release step-by-step

## Prerequisites (one-time)

1. `npm login` — must be logged in to the npm registry with publish rights for `@jinntec/fore`.
2. `gh auth login` — GitHub CLI must be authenticated for release-note generation.

## Release

Run:

```bash
npm run release -- patch | minor | major
```

This runs `scripts/release.sh`, which automates the previously manual steps:

1. Preflight checks: on `dev`, clean working tree, in sync with `origin/dev`, `npm whoami`/`npm ping`.
2. `npm version patch|minor|major` — runs tests (`preversion`), bumps `package.json`, commits, tags.
3. `git push` the `dev` branch.
4. Confirm, then `git push --tags`.
5. Confirm, then `npm publish --access public` (this also runs the build via the `prepare` hook). You'll be prompted for your npm OTP.
6. `gh release create <tag> --generate-notes` — auto-generates GitHub release notes from merged commits/PRs.
7. Confirm, then merges `dev` into `master` and pushes.

Each irreversible step (tag push, npm publish, master merge/push) requires a `[y/N]` confirmation.

## Updating the demo site

Run this **after** the release above, so the demo site picks up the correct published version:

```bash
npm run release:demo
```

This runs `scripts/update-demo.sh`, which:

1. Checks out the `demo` branch and merges `dev` into it. `demo/demo.js`, `demo/demo-build.js`, and `vite.build-dev.config.js` are protected from being overwritten via `.gitattributes` (`merge=ours`) — on the `demo` branch, `vite.build-dev.config.js` is customized to bundle `demo/demo-build.js` into `dist/demo.js` instead of building `dist/fore-dev.js`.
2. Shows what changed in those protected/demo-specific files during the merge, and pauses so you can manually update `demo/package.json` / `demo/demo.js` if third-party demo dependencies changed.
3. Reinstalls demo dependencies if `demo/package.json` changed.
4. Rebuilds `npm run build` (vite → `dist/fore.js` and `dist/demo.js`).
5. Confirms, then commits and pushes the `demo` branch.

Fore homepage and online demos are then published automatically via GitHub Pages from the `demo` branch.

## Manual fallback

If a script fails partway through, finish the remaining steps by hand using the equivalent commands listed above (`npm version`, `git push`, `git push --tags`, `npm publish --access public`, `gh release create <tag> --generate-notes`, `git merge dev` into `master`/`demo`, `npm run build`).