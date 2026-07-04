# Selective ("page-scoped") production build — investigation report

## Context

Fore ships one universal bundle (`dist/fore.js`, 855 KB / ~196 KB gzip) containing all ~55 `fx-*` custom elements regardless of which ones a given page actually uses. This report investigates the potential of a slimmer, page-scoped bundle — one that includes only the `fx-*` classes a page references plus whatever core code those depend on.

## What the numbers show

Measured directly from this repo's `dist/fore.js`, `src/`, and `node_modules/fontoxpath`:

| Layer | Raw source | Gzip (source, single-stream) | Prunable? |
|---|---|---|---|
| fontoxpath (XPath engine, already minified upstream) | 298 KB | 82 KB | **No** — needed by any page using bindings |
| "Core" (fx-fore, fx-model, fx-bind, fx-instance, ForeElementMixin, fore.js, xpath-evaluation/path/util, getInScopeContext, modelitem, dep_graph, DependencyNotifyingDomFacade) | 303 KB | ~58 KB (scaled to real minified terms) | **No** — pulled in transitively by almost every UI/action file regardless of which one you use |
| `src/ui/*` (23 files) | 190 KB | ~38–47 KB | **Yes**, partially |
| `src/actions/*` (27 files) | 109 KB | ~18–24 KB | **Yes**, partially |

fontoxpath + core alone already account for ~72% of the real gzip weight. The only prunable pool (`ui/` + `actions/`) is ~28% of gzip weight, and popular files in that pool (`fx-control.js` 30 KB, `fx-repeat.js` 35 KB raw) appear on almost every real page.

## Empirical validation (real builds, not estimates)

A manual spike was built: hand-written reduced entry points (`index.spike.js`, `index.spike-minimal.js`) fed through a copy of the existing `vite.build.config.js`, producing real bundles compared against the same baseline (`dist/fore.js`: 854.90 kB raw / 196.46 kB gzip):

| Scenario | Raw | Gzip | Reduction (raw / gzip) |
|---|---|---|---|
| Minimal (`fx-control` + `fx-output` + `fx-trigger` only) | 638.67 kB | 151.45 kB | 25.3% / 22.9% |
| `demo/edep/edit.html` (19 of ~55 tags, real complex page) | 698.05 kB | 164.78 kB | 18.3% / 16.1% |
| Full-featured page (most UI controls + several actions), estimated | — | — | ~6% (estimated, not spiked) |

The real build numbers landed almost exactly on the theoretical estimates, confirming the measurement methodology. Notably, `demo/edep/edit.html` already loads `fx-lens` and `fx-minimap` via separate `<script>` tags outside the main bundle (`demo/edep/edit.html:22-23`) — manual selective loading is already practiced in this codebase for heavier optional tools, which is a real precedent for this feature.

**Bottom line:** realistic gzip savings range from ~20-25% (minimal/widget-style pages) down to ~5-8% (typical full-featured forms). fontoxpath and core dominate the bundle regardless of page complexity, capping the upside.

## Recommended approach (if pursued)

The repo already contains a working precedent: `index-build.js` and `index.js` are hand-curated flat lists of side-effect imports (one `import './src/ui/fx-x.js'` per element), and Vite/Rollup already tree-shakes based on reachability from that entry with zero special config. The entire feature would be: auto-generate a smaller version of `index-build.js`, then point the existing build at it. No new bundler mechanics needed.

1. **Tag→file map generator** (new, e.g. `tools/build/tag-map.js`): scan `src/**/*.js` for `customElements.define(['"]([\w-]+)['"]` to build `{ 'fx-repeat': 'src/ui/fx-repeat.js', ... }` automatically — self-updating, no manifest to hand-maintain.
2. **Entry generator** (new, e.g. `tools/build/generate-entry.js`): parse the target HTML page(s) with a real DOM parser (must walk `<template>` contents explicitly via `.content`, not a naive `querySelectorAll`), collect the `fx-*` tags present, resolve via the tag map, and always include the fixed "always-on" core file list (core is not separable per element — e.g. `abstract-control.js` unconditionally imports `fx-model.js`, `abstract-action.js` unconditionally imports `fx-fore.js`). Emit a generated entry file mirroring `index-build.js`'s structure.
3. **Parameterize `vite.build.config.js`**: change the hardcoded `entry: './index-build.js'` and `fileName: 'fore'` to read from env vars with the current values as defaults, so default `npm run build` behavior is unchanged. Add an opt-in npm script (e.g. `build:selective`) that runs the generator then the parameterized build.

## Key risks / edge cases

- **`fx-include`/`fx-load` with external `src`** is the real detection hole — markup pulled in at runtime from another file isn't visible to a single-page static scan. Mitigation: recursively scan local-file `src` targets at build time; if `src` is a runtime expression or off-origin, warn and fall back to the full bundle unless the user passes an explicit override list.
- **JS-constructed markup** (`document.createElement`, dynamically computed tag names) is a genuine blind spot no static scan can catch. Mitigation: a per-project include/exclude override file as the safety valve.
- **Multi-page caching tradeoff**: a single shared `fore.js` is cached once across a multi-page app; per-page bundles fragment that cache and can be *net worse* in aggregate bytes for a multi-page site, since every page re-ships its own copy of fontoxpath + core. This narrows the good-fit zone to single-page apps, embeds/widgets, and standalone demo pages — not a wholesale replacement for the universal bundle.
- **Fail-safe default**: any uncertain construct should default to shipping the full bundle (today's safe behavior) rather than silently shipping a broken subset — a missing custom element degrades silently to an unstyled/unregistered tag with no clear error.

## Status

This was a research spike only — no tooling was built, and the temporary spike files (`index.spike*.js`, `vite.build.spike*.config.js`, `dist/fore.spike*.js`) were removed after measurement. The working tree is unaffected. Decision on whether to build the real tag-map + entry-generator tooling is pending.

### Reference files
- `index-build.js` — existing hand-curated entry point that a generator would generalize
- `vite.build.config.js` — existing prod build config that would need parameterizing (entry/fileName)
- `demo/edep/edit.html` — real-world validation target used in this spike
