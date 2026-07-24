# fore-codemirror

A CodeMirror 6 editor mode that knows Fore's `fx-*` element/attribute vocabulary:
tag and attribute completion, a linter that flags unknown `fx-*` tags or
attributes, and structural nesting checks (e.g. `<fx-bind>` outside `<fx-model>`,
or a UI element like `<fx-control>` inside `<fx-model>`). Validating the XPath
*content* of attributes like `ref`/`calculate`/`constraint` is out of scope for now.

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
npm run build-schema   # regenerate src/fore-schema.json (see below)
npm run build          # bundle -> dist/fore-codemirror-bundle.js
```

## Schema source

The tag/attribute vocabulary comes from the Fore element reference maintained in
the sibling `fore-skills` repo (`../../../fore-skills/reference.md` relative to a
typical checkout), **not** from `doc/fore-elements.json` in the main Fore repo
(that file is stale/experimental).

`src/fore-schema.json` is generated and checked in, so most contributors never
need to run `build-schema` themselves. Regenerate it after `reference.md` changes:

```bash
npm run build-schema
# or, if fore-skills isn't checked out as a sibling of the Fore repo:
FORE_REFERENCE_MD=/path/to/fore-skills/reference.md npm run build-schema
```

Known simplification: attributes from the reference doc's "Shared attributes"
(ForeElementMixin: `ref`/`context`/`value`) and "Shared action attributes"
(AbstractAction: `event`/`if`/`while`/...) sections are folded into
`extraGlobalAttributes` rather than modeled per-tag - so e.g. `<fx-output>` will
also complete `if`/`while` even though only action elements use them. Harmless
(an unused suggestion, not a lint error) and much simpler than modeling Fore's
attribute-inheritance chains here.

## Structural nesting rules

`src/fore-structure.json` is **hand-curated**, not generated - reference.md
documents attributes/events per element but doesn't reliably encode parent/child
constraints. Each rule is grounded in Fore's actual source (`/Users/joern/dev/Fore/src`):

- `fx-bind`, `fx-instance`, `fx-functionlib` - only processed when found under
  `<fx-model>`: `fx-model.js` collects `fx-model > fx-bind` (direct children) via
  `querySelectorAll` in `rebuild()`, then `fx-bind.js`'s `_processChildren()`
  recurses into `:scope > fx-bind` - so `<fx-bind>` may nest inside `<fx-bind>`
  arbitrarily deep, as long as the chain is ultimately rooted in `<fx-model>`.
  `fx-model.js` also does `querySelectorAll('fx-functionlib')`, scoped to itself.
  `fx-submission`/`fx-header`/`fx-connection` are documented as model children
  but have no matching `querySelector` in `fx-model.js` - included here by
  convention, not runtime enforcement.
- `fx-var` is **intentionally excluded** from these rules - it's genuinely
  dual-scope (valid both inside `<fx-model>` and at UI level); `fx-fore.js`
  explicitly does `if (variable.closest('fx-model')) return;` to avoid
  double-processing model-scope vars.
- UI elements (`fx-control`, `fx-group`, `fx-repeat`, ...) are **not** rejected
  by any runtime check inside `<fx-model>` - but `fx-model` sets `inert` on
  itself in `connectedCallback`, which cascades to descendants, so a control
  placed there renders but is permanently non-interactive. Flagged here as an
  error since it's a real, silent correctness bug even though nothing in Fore
  itself complains.
- `fx-construct-done` requires a **direct** `<fx-model>` parent - the one
  explicit runtime check in the codebase: it dispatches an `error` event itself
  if `this.parentNode.nodeName !== 'FX-MODEL'` (`src/actions/fx-construct-done.js`).
- `fx-case`/`fx-switch` and `fx-repeatitem`/`fx-repeat` - convention only
  (`fx-switch.js`/`fx-repeat.js` reach down for `:scope > fx-case`/`:scope >
  fx-repeatitem`; the reverse isn't checked), but these tags are meaningless
  anywhere else, so flagging them is safe.
- Action elements (`fx-setvalue`, `fx-dispatch`, ...) are deliberately **not**
  covered - `abstract-action.js` defaults an action's listener target to
  `this.parentNode` when no `target` attribute is given, with no requirement on
  what that parent is, so "wrong parent" isn't a meaningful check for actions in
  general (only `fx-construct-done`, above, is a real exception).

If Fore's structure changes, update `fore-structure.json` directly - there's no
regeneration script for it.

## Demo

Open `index.html` directly as a static file, or via Fore's dev server
(`npm start` at the repo root) at `/demo/fore-codemirror/index.html`.
