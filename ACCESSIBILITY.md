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
| 2.1.1/2.1.2 Keyboard / No Trap | All interactive widgets reachable and escapable via keyboard | **Fixed** (`fx-trigger` OK; `fx-dialog` deprecated in favor of native `<dialog>`, which provides this natively — see below) |
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
| `fx-dialog` | **Deprecated** in favor of native `<dialog>` (`fx-show`/`fx-hide` work against it unchanged), which provides `aria-modal`, focus trap, and Escape-to-close natively | **Fixed** (via deprecation) |
| `fx-repeat`/`fx-repeatitem` | `role="list"`/`"listitem"`; `fx-repeatitem.js`'s `this.tabindex = 0` no-op fixed | **Fixed** |
| `fx-control-menu` | `role="menu"`/`"menuitem"`, `aria-haspopup`/`aria-expanded` on the trigger, roving-tabindex arrow-key navigation | **Fixed** |

## Widget-pattern fixes (P1, shipped)

Each of these was genuine per-component widget-pattern work — it didn't fit the "implement once
in a shared choke point" model the foundation layer used, because these controls either bypass
`AbstractControl`'s handlers or need bespoke DOM structure a generic mixin can't infer. All four
are now done:

- [x] 1. **`fx-switch`/`fx-case` tab semantics** (`src/ui/fx-switch.js`, `src/ui/fx-trigger.js`) —
      see write-up below.
- [x] 2. **`fx-repeat` list semantics** (`src/ui/fx-repeat.js`, `src/ui/fx-repeatitem.js`) — see
      write-up below.
- [x] 3. **`fx-dialog` focus trap** — resolved by deprecation rather than a hand-rolled trap; see
      write-up below.
- [x] 4. **`fx-control-menu` menu semantics** — `role="menu"`/`"menuitem"`, `aria-haspopup`,
      `aria-expanded` on the trigger, roving-tabindex arrow-key navigation. See write-up below.

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

### 3. `fx-dialog` focus trap (`src/ui/fx-dialog.js`)

`fx-dialog` is a hand-rolled modal (`role="dialog"` + a `.show` class toggled by `fx-show`/
`fx-hide`) with real gaps: `aria-modal` is hardcoded `"false"` and never updated, there's no focus
trap, focus is set once on `connectedCallback` rather than on open, and the Escape-key handler in
`showModal()` calls a `this.hide()` method that doesn't exist on the class (a silent no-op, so
Escape never actually closed it).

Building a correct focus trap (tracking tab order, wrapping at the first/last focusable element,
capturing/restoring the triggering element, real `aria-modal` toggling) reimplements behavior the
native HTML `<dialog>` element already provides for free: `showModal()` traps focus, sets the
accessibility tree to modal, honors `autofocus`, and Escape-to-close is built in — and `fx-show`/
`fx-hide` already work against `<dialog>` unchanged, since they only call the shared
`.showModal()`/`.close()` method names via `resolveId()` (`demo/dialog.html` already demonstrated
this pattern). Patching `fx-dialog` to reimplement what the platform does natively (and arguably
worse, since hand-rolled traps are a common source of *new* a11y bugs) isn't worth it next to
switching to `<dialog>`.

- `src/ui/fx-dialog.js` is now marked `@deprecated` in its JSDoc, recommending native `<dialog>`.
  No functional change was made to the element itself — it keeps working as-is for any external
  pages still using it.
- Every in-repo demo using `<fx-dialog>` was migrated to native `<dialog>`: `demo/controls/
  fx-dialog.html`, `demo/controls/email.html`, `demo/generator/view-editor.html`, and
  `demo/tp/layout-templates/simple-index.html`. The migration is markup-only — swap the tag name,
  and (where a decorative `.close-dialog` link existed) wrap it in an `fx-trigger`/`fx-hide` pair
  like the other close buttons, since `fx-dialog.js` used to special-case that class internally via
  a raw `click` listener and native `<dialog>` has no equivalent.
- `resources/fore.css` (and its byte-identical vendored copy `demo/edep/css/fore.css`) gained a
  parallel `dialog`/`.dialog-content`/`.close-dialog`/`.action`/`::backdrop` rule set alongside the
  pre-existing (now legacy) `fx-dialog` rules, so migrated demos keep the same visual language.
  Centering/sizing rules that `fx-dialog` needed (`position:fixed`, manual `translate` centering)
  were dropped — native `<dialog>` centers itself via the UA stylesheet.
- `test/dialog.test.js` was updated to author `<dialog>` markup and assert `dialog.open` instead of
  `dialog.classList.contains('show')`; the `dialog-shown`/`dialog-hidden` event assertions are
  unchanged since those events are dispatched by the `fx-show`/`fx-hide` action classes, not by
  `fx-dialog.js`.
- The automated axe gate (`cypress/e2e/accessibility.cy.ts`) was not extended to cover a dialog
  page — the demos above aren't in its page list, and a real coverage addition would need to open
  the dialog before scanning (a `display:none`/closed dialog is skipped by axe) plus giving the
  dialog an accessible name (`aria-labelledby` pointing at its heading), which native `<dialog>`
  doesn't provide by default either. Left as a future addition, not bundled into this deprecation.

### 4. `fx-control-menu` menu semantics (`src/ui/fx-control-menu.js`)

`fx-control-menu` renders a slotted trigger `<button>` plus a shadow-DOM popup listing
currently-`[on-demand]` targets as plain `<a>` entries for activation (e.g. "add a field back
after it was hidden"). It's a single, non-polymorphic widget — every instance is the same ARIA
"menu button" pattern, so this ships unconditionally (unlike `fx-switch`'s opt-in tabs mode,
which had to accommodate several unrelated usages of the same element).

- The trigger `<button>` gets `aria-haspopup="true"` and `aria-expanded` (toggled open/close).
  `aria-controls` was deliberately **not** added: the button is light-DOM (slotted) while the
  popup lives in the shadow root, and an IDREF attribute can't cross that boundary — an
  `aria-controls` pointing at a shadow-DOM id would just resolve to nothing for assistive tech,
  the same cross-boundary problem the foundation layer's label association hit (see above,
  "label" attribute form). `aria-controls` is optional in the APG menu-button pattern, so it's
  omitted rather than shipped as a dangling reference. Previously `slotchange` re-attached the
  click handler on every re-slot with no de-dupe guard; a `button !== this.triggerButton` check
  was added so the ARIA attributes and reference are only (re-)wired once per button.
- The popup (`div.menu`) gets `role="menu"`; each generated entry gets `role="menuitem"` and a
  roving `tabindex` (`0` on the first item, `-1` on the rest, mirroring the pattern already used
  for `fx-switch`'s tabs).
- Opening the menu moves focus to the first item; Up/Down/Home/End move a roving tabindex between
  items while open (`_handleMenuKeydown`), following the WAI-ARIA menu pattern. Closing via
  Escape or an outside click restores focus to the trigger button; closing via item *selection*
  deliberately does **not** steal focus back to the trigger, since `fx-control.activate()`
  already moves focus to the newly-revealed widget one frame later — restoring focus to the
  button first would just have the widget steal it back immediately after, which reads as
  double focus movement to AT users.
- Opening/closing/disabling is now centralized in `_openMenu()`/`_closeMenu()` rather than
  toggling `classList`/`aria-expanded` ad hoc at each of the four call sites (button click,
  outside click, Escape, zero-targets in `updateMenu()`), so the ARIA state can't drift out of
  sync with the visible state.

## Backlog (P2, open)

What's left after the foundation layer and the four P1 widget-pattern fixes above. None of these
block the current release; they're the next candidates when accessibility work resumes.

- [ ] 1. **Icon accessible names (1.1.1)** — icon-only controls (`fx-trigger`, `fx-control-menu`)
      have no mechanism for naming a bare icon glyph. Needs a convention decision (e.g. an
      `icon-label` attribute, or requiring authors to supply visible/SR-only text) before it's an
      implementation task — confirmed no icon-related ARIA code currently exists in either file.
- [ ] 2. **`fx-group` labelling** — `role="group"` is set unconditionally
      (`src/ui/fx-group.js:39`) but there's no `aria-label`/`aria-labelledby` tying the group to a
      visible heading, so AT users hit an unnamed group. Same shape as the label-association work
      already done for `fx-control`/`fx-output`: prefer `aria-labelledby` when a heading child
      exists, fall back to `aria-label`.
- [ ] 3. **`fx-trigger` toggle/async state** — no `aria-pressed` or `aria-busy`; confirmed absent
      from `src/ui/fx-trigger.js`. Only relevant if `fx-trigger` has actual toggle semantics
      somewhere in the codebase — scope that before building it.
- [ ] 4. **`fx-upload`** — confirmed zero ARIA beyond inherited Layer 1 mirroring
      (required/readonly/invalid); no exposure of selected-file, progress, or upload-error state.
      Real widget-pattern work, not a shared choke point — largest item on this list.
- [x] 5. **Manual keyboard-only and screen-reader pass** — carried over from the foundation layer's
      verification checklist (still unperformed): VoiceOver/Safari and NVDA/Firefox-or-Chrome
      pass on `demo/controls/email.html`, confirming labels are announced, validation errors are
      announced without a focus move, nonrelevant-then-focused controls are unreachable by Tab,
      and hint/alert text is included in the field's accessible description. The axe gate only
      catches missing ARIA, not whether the result actually reads correctly — do this before
      adding more surface area (items 1–4 above).

Out of scope, unchanged from the foundation layer:

- **2.4.7 Focus Visible** — CSS-level, not audited.
- **3.3.3 Error Suggestion** — author-controlled (alert text is markup, not enforced).

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
      `demo/controls/email.html` — **not yet performed**, needs a human with actual assistive
      tech: confirm labels are announced, validation errors are announced without a focus move,
      nonrelevant-then-focused controls are unreachable by Tab, and hint/alert text is included in
      the field's accessible description.
