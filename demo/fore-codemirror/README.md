# fore-codemirror

A CodeMirror 6 editor mode that knows Fore's `fx-*` element/attribute vocabulary:
tag and attribute completion, a linter that flags unknown `fx-*` tags/attributes,
wrong nesting, elements missing a required child, and elements missing a required
attribute. Validating the XPath *content* of attributes like
`ref`/`calculate`/`constraint` is out of scope for now.

This is an isolated sub-package: its dependencies (CodeMirror + language/lint
packages) live only in this folder's own `package.json`/`node_modules`, not in
Fore's root `package.json`, and it is never part of `dist/fore.js` /
`dist/fore-dev.js`. A page opts in explicitly:

```html
<script type="module" src="./dist/fore-codemirror-bundle.js"></script>
<fore-codemirror></fore-codemirror>
```

## Setup

```bash
npm install
npm run build   # bundle -> dist/fore-codemirror-bundle.js
```

## Vocabulary source: `src/fore-tree.json`

`src/fore-tree.json` is the single, hand-curated source of truth for Fore's
`fx-*` vocabulary - it replaces what used to be three separate files
(`fore-schema.json`, `fore-structure.json`, `fore-categories.json`). It is not
generated - reference docs don't reliably encode parent/child constraints or
which attributes actually matter at runtime, so every rule here is grounded in
Fore's actual source (`/Users/joern/dev/Fore/src`) and cross-checked against
all demos under `demo/`.

Shape, per tag in `"tree"`:

```json
"fx-bind": {
  "attrs": { "ref": null, "type": ["xml", "json"] },
  "children": ["fx-bind", "fx-alert"],
  "requiredAttrs": { "all": ["ref"], "severity": "warning" }
}
```

- **`attrs`** - `{ name: null | [enumValues] }`, fed straight into
  `@codemirror/lang-html`'s `extraTags` for completion. Attributes shared by
  almost every element (`ref`/`context`/`value` from `ForeElementMixin`,
  `event`/`if`/`while`/`iterate`/`delay`/`target`/`phase`/`propagate`/
  `default-action` from `AbstractAction`) are **not** repeated per tag - they
  live once in `fore-html-mode.js`'s `GLOBAL_ATTRS` instead.
- **`children`** - literal tag names and/or macro references (`"macros"`:
  `HTML-ELEMENTS`, `ACTION-ELEMENTS`, `UI-ELEMENTS`). Containment is
  positional: a tag is legal wherever it's reachable from its nearest tracked
  ancestor's `children` - no separate allow/deny list needed for most cases,
  since something simply not being listed already makes it invalid there.
  `fore-html-mode.js`'s `nearestTrackedAncestor()` skips over plain HTML
  wrappers (`<div>`, `<section>`, ...) to find that ancestor, and treats a
  `<template>` as a tracked anchor only when it's genuinely an `<fx-repeat>`'s
  own template (see "Ambiguous `<template>`" below).
- **`requiredChildren`** - e.g. `fx-repeat` needs a `<template>` somewhere in
  its subtree (found via the same `querySelector('template')` semantics
  `repeat-base.js` itself uses, not just as an immediate child) or it has
  nothing to repeat.
- **`requiredAttrs`** - `{ all: [...], anyOf: [...], severity }`. `all` means
  every listed attribute must be present; `anyOf` means at least one must be.
  `severity: "error"` is used where the element's own code throws,
  `console.error`s, or dispatches an `error` event when the attribute is
  missing; `"warning"` where it silently no-ops or falls back to a default and
  is merely pointless without it. Deliberately **not** applied to elements
  that are legitimately useful unbound (`fx-group`, `fx-switch`, `fx-alert`,
  `fx-items` can all appear without `ref`, e.g. as pure layout, an imperative
  `fx-toggle`-driven switch, a static validation-summary alert, or a
  statically-authored radio-button list) - only where real evidence shows the
  element is actually broken without it.
- **`authorable: false`** - a real tag/class (`fx-repeatitem`,
  `fx-repeat-attributes`, `fx-abstract-control`) the linter should recognize
  by name but flag as an error if a user writes it literally, since it's
  runtime-generated (from `<fx-repeat>` iteration, or a `data-ref` attribute)
  or base-class-only.

`"exceptions"` holds the one rule position alone can't express:
`fx-repeat-ref` needs a literal ancestor *path* (`template` inside
`fx-repeat`), not just "somewhere under `fx-repeat`" - because `<template>` is
a plain HTML tag also used for unrelated purposes (see below).

### Ambiguous `<template>`

`<template>` is overloaded: Fore's `fx-repeat` uses it for the per-iteration
body, but demo pages also use a plain HTML `<template>` for unrelated things
(e.g. wrapping a whole `<fx-fore>` for deferred/lazy rendering - see
`demo/uri.html`, `demo/while.html`, and many others). `fore-html-mode.js`
disambiguates by checking what the *next* tracked ancestor beyond the
`<template>` is: if it's `fx-repeat`, the template's own (repeat-item-shaped)
`children` list applies; otherwise the `<template>` is skipped over entirely,
same as any other untracked wrapper.

### Updating

If Fore's structure or attributes change, edit `src/fore-tree.json` directly -
there's no regeneration script. After editing, re-run `npm run build` to
refresh `dist/fore-codemirror-bundle.js`.

## Demo

Open `index.html` directly as a static file, or via Fore's dev server
(`npm start` at the repo root) at `/demo/fore-codemirror/index.html`. The
playground at `/demo/playground/index.html` uses the same bundle for its
markup/instance editors.
