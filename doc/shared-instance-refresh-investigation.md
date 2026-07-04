# Investigation: UI refresh gap for shared instances in instance-less nested `fx-fore`

## Context

Found while building undo/redo (`src/UndoManager.js`, `FxModel.getEffectiveUndoManager()`).
Not caused by, or specific to, undo/redo — it reproduces with a plain `fx-setvalue` and
no undo code involved. Documenting here for separate follow-up rather than blocking that
feature on it.

## Setup

A nested `<fx-fore>` whose own `<fx-model>` declares **no** `<fx-instance>` of its own and
operates entirely on an ancestor's `shared` instance (the pattern shown in
`demo/shared-instances.html`, e.g. `child-b`):

```html
<fx-fore id="outer">
  <fx-model>
    <fx-instance id="counters" shared>
      <data><count>0</count></data>
    </fx-instance>
  </fx-model>

  <fx-fore id="inner">
    <fx-model></fx-model>
    <fx-trigger>
      <button></button>
      <fx-setvalue ref="instance('counters')/count" value="instance('counters')/count + 1"></fx-setvalue>
    </fx-trigger>
    <fx-output ref="instance('counters')/count"></fx-output>
  </fx-fore>
</fx-fore>
```

## Symptom

After clicking the trigger inside `#inner`:
- The underlying data is correctly updated (`instance('counters')/count` becomes `1`, confirmed
  by reading `instanceData` directly).
- `#inner`'s own `<fx-output>` bound to that same node renders as an **empty string**, not `0`
  (the pre-update value) and not `1` (the post-update value).

Reproduced in Karma/Mocha (`test/undo-redo.test.js`, "nested fx-fore with a shared instance"
describe block asserts on the data only, with a comment pointing here) across both Chrome and
ChromeHeadless launchers - not a headless-only quirk.

## What's actually happening (traced with `captureConsole: true`)

1. `#inner`'s `FxModel.instances` is `[]` (no local `<fx-instance>`), so
   `modelConstruct()`'s `instances.length > 0` branch is skipped and **`updateModel()` is never
   called for `#inner`'s model at construct time** (`src/fx-model.js`, `modelConstruct()`).
   Consequently `#inner`'s `rebuild()` never runs and `this.mainGraph` stays `undefined`
   permanently - confirmed via `innerModel.mainGraph === undefined` both before and after the
   action.
2. Despite that, `innerModel.modelItems.length === 1` **before** the action even fires - a
   `ModelItem` gets registered lazily (via `getModelItem()`/`ForeElementMixin.js`, not via
   `rebuild()`) the first time `<fx-output>` resolves its `ref`.
3. The action's default cycle (`AbstractAction.actionPerformed()`) calls
   `model.recalculate()` / `model.revalidate()` on `#inner`'s model. Despite `mainGraph` being
   `undefined`, the modelItem's `node` **does** get updated to `<count>1</count>`, and it **is**
   pushed into `batchedNotifications` - log shows `🔄 🎯 ### processing 1 batched notifications`
   with the correct, updated ModelItem.
4. So the notification pipeline finds the change and dispatches processing for it. Yet the
   `<fx-output>` text content ends up `""`, not `"1"` - and not `"0"` either, i.e. something
   *clears* the rendered value rather than merely failing to update it.

This means the bug is narrower than "instance-less models never refresh" (they partially do -
the modelItem tracking and batching correctly detect the change). The defect is specifically in
how the bound UI element's value gets (re-)resolved/rendered during that partial-refresh pass
when its owning model has no local instance context of its own - the most likely candidate is
some form of context/default-instance resolution inside the refresh path (e.g.
`getDefaultContext()`/`evalInContext()` for an instance-less model) producing a stale or empty
context on the second pass, distinct from the first (successful, full) initial render.

## What is NOT affected

- The underlying instance document is always correct (verified directly via `instanceData`
  queries in every undo/redo test) - this is a **display** bug, not a data-integrity bug.
- `fx-repeat`-driven rendering of shared data inside such a nested fore (e.g.
  `<fx-repeat ref="instance('todos')/todo"><template><fx-control ref="."></fx-control></template></fx-repeat>`,
  as used by `demo/shared-instances.html`'s own `child-a`/`child-b`) was not confirmed broken
  or working in isolation - only tested indirectly (initial full refresh renders correctly;
  post-mutation partial refresh was not separately verified for the repeat case since the
  relevant test only asserts instance data, not rendered text).
- Actions that call `model.updateModel()` directly (full rebuild+recalculate+revalidate, e.g.
  `fx-reset`, or `fx-undo`/`fx-redo` from the undo/redo feature, which deliberately call
  `updateModel()` + `refresh(true)`) are **not** affected, since a full refresh
  (`Fore.refreshChildren`) doesn't depend on the dependency-graph/batching shortcut that's
  broken here. This is why `fx-undo`/`fx-redo` reliably fix up the display even in this
  scenario, while the plain increment action alone does not.

## Suggested next steps (not investigated further here)

- Instrument `_processBatchedNotifications` / the specific UI-element refresh call for this
  exact case to see what value the `fx-output` actually receives when it re-evaluates its
  `ref` during the partial pass (vs. the full initial pass).
- Check whether `getDefaultContext()` / `getInScopeContext()` behave differently for a model
  with zero local instances on a second evaluation pass.
- Decide whether `modelConstruct()` should run `rebuild()` (or at least initialize
  `mainGraph`) even when `instances.length === 0`, so instance-less "consumer" fores get a
  real dependency graph instead of silently degraded partial refreshes.
