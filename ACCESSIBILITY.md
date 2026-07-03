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
`demo/controls/email.html` (fx-control + label + fx-items + fx-dialog) and
`demo/controls/fx-output.html` (output-label path).

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
| `fx-repeat`/`fx-repeatitem` | `delegatesFocus` shadow root; no `role="list"`/`"listitem"`; `fx-repeatitem.js`'s `this.tabindex = 0` is very likely a no-op (should be `this.tabIndex = 0` or `setAttribute('tabindex','0')` — reflected IDL property is camelCase) | Backlog |
| `fx-control-menu` | Consumes `aria-label` from targets but its generated popup has no `role="menu"`/`"menuitem"`, no `aria-haspopup`/`aria-expanded`, no arrow-key navigation | Backlog |

## Backlog (P1, out of scope for the foundation layer)

Each of these is genuine per-component widget-pattern work — it doesn't fit the "implement once
in a shared choke point" model the foundation layer used, because these controls either bypass
`AbstractControl`'s handlers or need bespoke DOM structure a generic mixin can't infer:

- [x] 1. **`fx-switch`/`fx-case` tab semantics** (`src/ui/fx-switch.js`, `src/ui/fx-trigger.js`) —
      see write-up below.
- [ ] 2. **`fx-repeat` list semantics** — `role="list"`/`"listitem"` (or `aria-rowcount`/`aria-posinset`
      for large lists), plus fixing the `fx-repeatitem.js` `tabindex` no-op.
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

## Verification

- [x] `npm test` — karma/mocha unit suite: 856 passing (incl. new assertions for
      `aria-required`, `aria-readonly`, `aria-invalid`, label association, `aria-describedby`,
      `inert`, the `fx-alert` live-region attributes, and — new — `fx-switch`'s `appearance="tabs"`
      role/`aria-selected`/roving-tabindex wiring and arrow-key navigation in
      `test/switch.test.js`).
- [x] `npx cypress run` — full e2e suite: 38 specs / 93 tests passing, including the pre-existing
      `native-validation.cy.js` and `binding.valid-relevant.cy.js` (both assert `aria-invalid` and
      kept passing unchanged) plus the new `accessibility.cy.ts` automated axe gate.
- [ ] Manual keyboard-only and screen-reader (VoiceOver/Safari, NVDA/Firefox or Chrome) pass on
      `demo/controls/email.html` — **not yet performed**, needs a human with actual assistive
      tech: confirm labels are announced, validation errors are announced without a focus move,
      nonrelevant-then-focused controls are unreachable by Tab, and hint/alert text is included in
      the field's accessible description.
