# Accessibility

Fore's strongest target market — government/public-sector and GLAM (galleries, libraries,
archives, museums) forms — carries some of the strictest accessibility compliance requirements
(Section 508, EN 301 549), both of which defer to **WCAG 2.1 AA**. This document tracks the
current state, the fixes shipped as the "foundation" layer, and what's still open.

## Rubric (WCAG 2.1 AA, form-relevant subset)

| Criterion | What it requires | Status |
|---|---|---|
| 1.1.1 Non-text Content | Icons (`fx-trigger`, `fx-control-menu`) need accessible names | Backlog |
| 1.3.1 Info and Relationships | Label/hint/alert programmatically associated with their control | **Fixed** (foundation) |
| 2.1.1/2.1.2 Keyboard / No Trap | All interactive widgets reachable and escapable via keyboard | Partial — `fx-trigger` OK, `fx-dialog` has no focus trap (Backlog) |
| 2.4.3 Focus Order | Nonrelevant controls must not be reachable by Tab | **Fixed** (foundation, via `inert`) |
| 2.4.6 Labels or Instructions | Every control has a name | **Fixed** (foundation) |
| 2.4.7 Focus Visible | Custom widgets show a visible focus indicator | Not audited (CSS-level, out of scope) |
| 3.3.1/3.3.2 Error ID / Labels | Validation errors identified and associated with the field | **Fixed** (foundation) |
| 3.3.3 Error Suggestion | Error text is descriptive | Author-controlled (alert text is markup, not enforced) |
| 4.1.2 Name, Role, Value | Required/readonly/invalid state exposed to AT | **Fixed** (foundation) |
| 4.1.3 Status Messages | Dynamic error text is announced without a focus move | **Fixed** (foundation, `fx-alert` live region) |

## What shipped (foundation layer)

- [x] 1. ModelItem state → ARIA mirroring (`src/ui/abstract-control.js`, `src/ui/UIElement.js`, `src/ui/fx-container.js`)
- [x] 2. Label/hint/alert association (`src/ui/fx-control.js`, `src/ui/fx-output.js`, `src/ui/fx-alert.js`)
- [x] 3. Automated regression gate (`cypress-axe`/`axe-core`, `cypress/e2e/accessibility.cy.ts`)

### 1. ModelItem state → ARIA mirroring (`src/ui/abstract-control.js`, `src/ui/UIElement.js`, `src/ui/fx-container.js`)

Previously only `aria-invalid` was mirrored from ModelItem state (via `_syncAriaInvalid()`).
`required`/`readonly`/`relevant` had no ARIA equivalent at all.

- **Native-first**: native form elements (`<input>`/`<select>`/`<textarea>`/`<button>`) already
  expose `required`/`readonly` to assistive tech via their native attributes — adding
  `aria-required`/`aria-readonly` on top would be redundant ARIA. These are now only added when
  `getWidget()` returns a **non-native** widget (a custom element used via `class="widget"`).
  `aria-invalid` remains the unconditional exception (no native equivalent exists).
- **Relevant → `inert`**: CSS already hides `[nonrelevant]` elements (`display:none` in
  `resources/fore.css`), which already removes them from the accessibility tree and tab order.
  `inert` is added as a semantic backstop (matching the pattern already used correctly by
  `fx-switch.js`'s case-toggling) rather than `aria-hidden`, which would be redundant given the
  existing CSS. Implemented once in `UIElement._reflectRelevantInert()`, called from both
  `AbstractControl.handleRelevant()` (controls) and `FxContainer.handleRelevant()` (containers) —
  two call sites because containers don't inherit from `AbstractControl`.
- Removed the duplicate inline `aria-invalid` sets inside `handleValid()`'s branches — the
  unconditional `_syncAriaInvalid()` call at the end of the method already did this; this also
  resolved a long-standing `// TODO: duplicate code` comment.

### 2. Label/hint/alert association (`src/ui/fx-control.js`, `src/ui/fx-output.js`, `src/ui/fx-alert.js`)

Only `fx-items.js` (checkbox/radio lists) had working `for`/`id` label association; the mainline
`fx-control`/`fx-output` controls had none.

- `fx-control`'s light-DOM `<label>` child form (`<fx-control><label>Name</label>...`) now gets a
  generated/reused id wired via `for`/`id` — both label and widget are light-DOM children slotted
  into the same tree, so this works.
- `fx-control`'s `label="..."` attribute form is rendered as plain text into the **shadow root**
  (a different tree than the light-DOM widget), so an id reference can't cross that boundary —
  this form now sets `aria-label` on the widget instead (a string, which does cross the boundary).
- `fx-output`'s named `<slot name="label">` feeds a shadow-DOM `<span>` widget — same
  cross-boundary problem, same fix: `aria-label` derived from the slotted label's text via a
  `slotchange` listener.
- Statically-authored `<fx-hint>`/`<fx-alert>` children (and dynamically-created alerts from a
  `<fx-bind>`'s `alert` attribute) are now wired into the widget's `aria-describedby`, appended
  without clobbering any existing value. The reference is assigned once, when the id is first
  established, rather than added/removed on every valid/invalid transition — the alert element
  persists in the DOM and is purely CSS-hidden when inactive, and `display:none` content isn't
  exposed via the accessible description anyway, so toggling the reference would add complexity
  with no behavioral benefit.
- `fx-alert` now sets `role="alert"`, `aria-live="assertive"`, `aria-atomic="true"` on its host
  element, so validation errors are announced by assistive tech without requiring a focus move.

### 3. Automated regression gate

`cypress-axe` + `axe-core` added as devDependencies, wired into `cypress/support/e2e.ts`. New
spec `cypress/e2e/accessibility.cy.ts` runs an automated WCAG 2.1 A/AA check against
`demo/controls/email.html` (fx-control + label + fx-items + fx-dialog),
`demo/controls/fx-output.html` (output-label path), and — new —
`demo/controls/fx-repeat.html` (a populated repeat using `slot="header"` for a non-repeated column
header, plus a zero-item repeat), added as standing coverage for the `fx-repeat` list-semantics
work below.

`demo/controls/ui.html` was the original intended primary target but turned out to be broken
independent of accessibility: it has no `<script>` tag loading Fore at all (so none of its custom
elements ever upgrade) and references model paths (`to/email`, `subject`, `message`,
`attachments`) with no `<fx-model>`/`<fx-instance>` defining them. It also had a stray `<<fx-fore>`
typo (fixed in passing — a trivial one-character correction). Making the page actually functional
is a separate, unrelated fix and out of scope here; `demo-with-issues.md` should be updated to
list it.

## Gap list — condensed per component

| Component | Current state | Fix layer |
|---|---|---|
| `fx-control` | Label association, `aria-label`, hint/alert `aria-describedby` | **Fixed** |
| `fx-output` | `aria-label` from slotted label | **Fixed** |
| `fx-items` | Already had working `for`/`id` association (the one correct example pre-existing) | n/a |
| `fx-trigger` | Has `role="button"`, `tabindex`, keyboard activation (Space/Enter) — best-covered control already; no `aria-pressed`/`aria-busy` for toggle/async semantics | Backlog |
| `fx-upload` | No ARIA beyond inherited Layer 1 mirroring | Covered by Layer 1 only |
| `fx-alert` | `role="alert"`, `aria-live`, `aria-atomic`, wired `aria-describedby` | **Fixed** |
| `fx-hint` | Wired into `aria-describedby`; itself `@deprecated` in source, not restructured | **Fixed** (association only) |
| `fx-group` | `role="group"` already set; no `aria-label`/`aria-labelledby` tying it to a visible group label | Backlog |
| `fx-switch`/`fx-case` | Correct `inert` toggling; opt-in `appearance="tabs"` adds `role="tablist"`/`"tab"`/`"tabpanel"`, `aria-selected`, roving tabindex, arrow-key navigation | **Fixed** (opt-in) |
| `fx-dialog` | `role="dialog"` set but `aria-modal` hardcoded `"false"` and never updated; no focus trap; focus set on connect, not on show | Backlog |
| `fx-repeat`/`fx-repeatitem` | `role="list"`/`"listitem"`; `fx-repeatitem.js`'s `this.tabindex = 0` no-op fixed | **Fixed** |
| `fx-control-menu` | Consumes `aria-label` from targets but its generated popup has no `role="menu"`/`"menuitem"`, no `aria-haspopup`/`aria-expanded`, no arrow-key navigation | Backlog |

## Backlog (P1, out of scope for the foundation layer)

Each of these is genuine per-component widget-pattern work — it doesn't fit the "implement once
in a shared choke point" model the foundation layer used, because these controls either bypass
`AbstractControl`'s handlers or need bespoke DOM structure a generic mixin can't infer:

- [x] 1. **`fx-switch`/`fx-case` tab semantics** (`src/ui/fx-switch.js`, `src/ui/fx-trigger.js`) —
      see write-up below.
- [x] 2. **`fx-repeat` list semantics** (`src/ui/fx-repeat.js`, `src/ui/fx-repeatitem.js`) — see
      write-up below.
- [ ] 3. **`fx-dialog` focus trap** — real `aria-modal` toggling on show/hide, focus moved into the
      dialog on open (not on connect) and restored to the trigger on close, Escape-to-close, and a
      focus trap while open.
- [ ] 4. **`fx-control-menu` menu semantics** — `role="menu"`/`"menuitem"`, `aria-haspopup`,
      `aria-expanded` on the trigger, roving-tabindex arrow-key navigation.

### 1. `fx-switch`/`fx-case` tab semantics (`src/ui/fx-switch.js`, `src/ui/fx-trigger.js`)

`fx-switch` is polymorphic — it's used as a bound panel switcher (driven by a `<select>`, no
trigger children at all), as a wizard, as an accordion (`fx-trigger`/`fx-case` pairs interleaved
as children, each trigger immediately followed by its own panel), and as tabs. A real ARIA
`tablist` may only own `tab` children, and `fx-trigger`↔`fx-case` linkage isn't structural — it's
a by-ID reference buried in `fx-toggle`'s `case` attribute, resolved via
`ownerForm.querySelector('#id')`. Applying `role="tablist"`/`"tab"`/`"tabpanel"` unconditionally
would put invalid ARIA on wizards, accordions, and bound switches (axe's `aria-required-children`
would flag the accordion pattern specifically, since its panels sit *inside* the switch as
siblings of the triggers). So this ships as an **opt-in** `appearance="tabs"` attribute rather
than default behavior on every `fx-switch` — see `demo/switch-tabs.html`.

- With `appearance="tabs"`, `fx-switch` renders `<div role="tablist"><slot name="tab"></slot></div>`
  followed by the regular default slot, in its shadow root. Direct-child `fx-trigger`s that carry
  an `fx-toggle` targeting a sibling `fx-case` are assigned `slot="tab"` — this regroups them
  under the tablist *in the flattened (accessibility) tree* without moving them in the light DOM,
  so document order and existing markup stay untouched.
- Each such trigger's widget gets `role="tab"`, `aria-controls` (pointing at its case), and a
  roving `tabindex` (`0` for the selected tab, `-1` for the rest); its target `fx-case` gets
  `role="tabpanel"`, `aria-labelledby` (pointing back at the tab), and `tabindex="0"`. IDs are
  generated via `Fore.createUUID()` when missing, matching the pattern already used for label/hint
  association in the foundation layer.
- `fx-trigger.js`'s default `role="button"` assignment (in its `slotchange` handler) is now
  guarded to skip elements that already carry an explicit `role` — a one-line change needed so
  `fx-switch`'s `role="tab"` isn't raced/overwritten back to `"button"`.
- Arrow-key navigation (Left/Right/Up/Down/Home/End) is wired via a single delegated `keydown`
  listener on `fx-switch`, following the WAI-ARIA "automatic activation" tabs pattern: moving
  focus to a tab also activates its case (calls the trigger's own `performActions()`, so it goes
  through the normal `fx-toggle` path rather than duplicating switch logic).
- Plain `fx-switch` usage (no `appearance="tabs"`) is completely unaffected — the attribute is
  read once in `connectedCallback` and everything described above is skipped when absent.

### 2. `fx-repeat` list semantics (`src/ui/fx-repeat.js`, `src/ui/fx-repeatitem.js`)

Unlike `fx-switch`, `fx-repeat` isn't polymorphic — it only ever means "repeat this template once
per bound node" — so `role="listitem"` ships unconditionally on every `fx-repeatitem`, the same way
`fx-group` unconditionally sets `role="group"`.

- Each `fx-repeatitem` sets `role="listitem"` on itself in `connectedCallback`.
- `role="list"` does **not** go on the `fx-repeat` host itself. `fx-repeat` supports a named
  `slot="header"` for non-repeated content rendered alongside the repeated items (e.g.
  `demo/api.html`'s `<table slot="header">` column-header row). If `role="list"` were on the host,
  that header content would land in the *list's* accessibility subtree in the flattened tree
  (Shadow DOM slotting doesn't change the light-DOM parent, but it does change the accessibility
  tree), and axe's `aria-required-children` flags it: a `<table>` (or anything with a role other
  than `listitem`/`group`) isn't an allowed child of `role="list"` — confirmed empirically with a
  throwaway `cy.checkA11y` run before landing this. So, matching the same wrapper technique
  `fx-switch`'s tabs mode uses for `role="tablist"`, the shadow root now wraps only the *default*
  slot (where `fx-repeatitem`s land) in `<div part="list" role="list">`, leaving
  `<slot name="header">` outside it:
  ```html
  <slot name="header"></slot>
  <div part="list" role="list"><slot></slot></div>
  ```
  An empty repeat (nodeset resolves to zero items, e.g. an "add your first item" pattern) was also
  checked with axe — a `role="list"` wrapper with zero `listitem` children does **not** trigger
  `aria-required-children`, so no extra guard was needed for that case.
- The wrapper `<div>` also needed `display: contents` (added in `fx-repeat.js`'s shadow `<style>`).
  A bare `<slot>` renders as layout-transparent (`display: contents`-like) by default, so demos
  that put `display: flex`/`grid` directly on the `fx-repeat` host — e.g. `demo/kanban.html`'s
  `#column { display: flex }`, used to lay out the board's columns side by side — relied on the
  repeated `fx-repeatitem`s being direct flex items of the host. Without `display: contents` on the
  wrapper, the wrapper itself becomes the sole flex item and the columns collapse into a vertical
  stack instead of a row — a regression that every automated test in this repo (unit, axe, and the
  functional `kanban.cy.ts` drag/drop specs) sailed straight through, because none of them assert
  computed layout. Caught by rendering `demo/kanban.html` in a real browser and diffing
  `getBoundingClientRect()` of the column `fx-repeatitem`s before/after (same `top`, increasing
  `left` confirms the row layout held). `display: contents` has a history of dropping the element's
  role from the accessibility tree in some browsers, so this was re-verified with a scoped
  `cy.checkA11y('#column', { runOnly: ['aria-required-children', 'aria-required-parent'] })` run
  against the live kanban page — both rules passed, confirming `role="list"` still parents the
  `listitem`s correctly through the `display: contents` wrapper.
- The unrelated table-repeat widget (`fx-repeat-attributes.js`, driven by `table[data-ref]`,
  producing real `<tr class="fx-repeatitem">` rows) is untouched — real table rows already carry
  an implicit `role="row"` and forcing `role="listitem"` onto them would be invalid ARIA. That
  widget doesn't use the `<fx-repeatitem>` custom element at all, so it's unaffected by this change.
- Fixed `fx-repeatitem.js`'s `this.tabindex = 0` — `tabindex` (lowercase) is not a reflected IDL
  property on `HTMLElement` (only the camelCase `tabIndex` is), so the assignment was a silent
  no-op that created a throwaway JS property instead of the `tabindex` attribute. Repeat items were
  therefore never keyboard-focusable even though a `focusin` listener already existed to react to
  them being focused (`_dispatchIndexChange`). Replaced with `setAttribute('tabindex', '0')`, which
  makes every repeat item Tab-reachable and activates that existing focus-handling path. Note this
  is a behavior change beyond "fixing a bug that did nothing": a large plain-data repeat now adds
  one tab stop per row (previously only `draggable` items were focusable, via a separate
  `setAttribute('tabindex', 0)` in `_createNewRepeatItem`) — sensible for master-detail row
  selection (the pattern `focusin` → `_dispatchIndexChange` already existed for), but worth knowing
  if a very long static list ever feels noisy under keyboard/AT navigation.

## Verification

- [x] `npm test` — karma/mocha unit suite: 858 passing (incl. new assertions for
      `aria-required`, `aria-readonly`, `aria-invalid`, label association, `aria-describedby`,
      `inert`, the `fx-alert` live-region attributes, `fx-switch`'s `appearance="tabs"`
      role/`aria-selected`/roving-tabindex wiring and arrow-key navigation in
      `test/switch.test.js`, and — new — `fx-repeat`/`fx-repeatitem`'s `role="list"`/`"listitem"`
      and the fixed `tabindex` in `test/repeat.test.js`).
- [x] `npx cypress run` — full e2e suite: 38 specs / 94 tests passing, including the pre-existing
      `native-validation.cy.js` and `binding.valid-relevant.cy.js` (both assert `aria-invalid` and
      kept passing unchanged) plus the `accessibility.cy.ts` automated axe gate — now 3 pages,
      including the new `demo/controls/fx-repeat.html`. Before landing the wrapper-`<div>` fix, a
      throwaway `cy.checkA11y` run against a `slot="header"` + zero-item repeat caught a real
      `aria-required-children` violation from an earlier version that put `role="list"` directly on
      the `fx-repeat` host; that page is now `demo/controls/fx-repeat.html`, kept as permanent gate
      coverage instead of being thrown away.
- [ ] Manual keyboard-only and screen-reader (VoiceOver/Safari, NVDA/Firefox or Chrome) pass on
      `demo/controls/email.html` — **not yet performed**, needs a human with actual assistive
      tech: confirm labels are announced, validation errors are announced without a focus move,
      nonrelevant-then-focused controls are unreachable by Tab, and hint/alert text is included in
      the field's accessible description.
