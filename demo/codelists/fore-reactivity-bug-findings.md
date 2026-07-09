# `codelist-editor.html`'s row filter: from plain JS to a Fore `fx-bind[relevant]`

**Status: resolved.** `codelist-editor.html`'s "Filter codes" search box now
uses the idiomatic Fore pattern — `fx-bind[relevant]` +
`fx-repeatitem[nonrelevant] { display: none }` — instead of the plain
JS/DOM filtering this document originally explained the need for. Three real
Fore-adjacent bugs blocked that pattern and the surrounding editor UI; all
three are now fixed (commits `ac13863f`, `815e1540`, the
`_processBatchedNotifications` fix below, and the `.kept-count` fix in bug 3
below). This document keeps the original root-cause analysis as a historical
record, and adds the two further bugs found while actually wiring the fix up
against real (250–800+ row) codelists.

## Bug 1 (fixed): cross-instance `relevant` never reactively recomputed

This document originally recorded a real bug in Fore's dependency-graph
construction, triggered specifically by this file's use of two separate
`fx-instance` elements (`codelist` for the loaded data, `vars` for UI/session
state). It is **not** a case of "Fore's relevant binding doesn't reactively
update" in general — that pattern is correctly documented and does work,
confirmed by a minimal from-scratch reproduction below. It failed here for one
specific, narrow reason, kept below for reference.

## The bug, precisely

**A bind's `relevant` (and, by the same code path, `calculate`/`required`/
`constraint`) does not reactively recompute when the expression references a
node in a *different* `fx-instance` than the one the bind's own `ref`
targets.**

Root cause, in `node_modules/@jinntec/fore/src/fx-bind.js`,
`_buildBindGraph()`:

```js
const instanceId = XPathUtil.resolveInstance(this, this.ref);   // instance of the BIND'S OWN ref
...
const relevantRefs = this._getReferencesForProperty(this.relevant, node);
this._addDependencies(relevantRefs, node, path, 'relevant', instanceId);
```

`_addDependencies` then canonicalizes the path of *every* node the `relevant`
expression references using that one `instanceId` — including references to
nodes that actually live in a completely different instance:

```js
_addDependencies(refs, node, path, property, instanceId) {
  ...
  refs.forEach(ref => {
    const otherPath = getPath(ref, instanceId);   // wrong instanceId for cross-instance refs
    ...
    this.model.mainGraph.addDependency(nodeHash, otherPath);
  });
}
```

For a bind like:

```html
<fx-bind ref="instance('codelist')/SimpleCodeList/Row"
          relevant="contains(lower-case(Value[2]/SimpleValue), lower-case(instance('vars')/filtertext))">
</fx-bind>
```

`instanceId` resolves to `'codelist'` (the bind's own `ref`). The dependency
graph then registers the edge as `Row[n]:relevant → $codelist/filtertext[1]`
— a path that doesn't exist. The *real* `filtertext` node's canonical path
(used everywhere else, e.g. by `fx-control`'s change tracking) is
`$vars/filtertext[1]`. Confirmed directly against the running page:

```js
model.mainGraph.dependenciesOf('$codelist/SimpleCodeList[1]/Row[1]:relevant')
// => ["$codelist/filtertext[1]"]     <- mislabeled, this path doesn't correspond to any real node
```

### Why this actually breaks reactivity

`fx-control.setValue()` **does** trigger a genuine update cycle — this part
works as designed. It delegates to an `fx-setvalue` action, whose
`actionPerformed()` (`abstract-action.js`) calls
`model.recalculate(); model.revalidate(); ownerForm.refresh(false)` on every
value commit, confirmed in the console log on every keystroke.

`recalculate()` (`fx-model.js`) builds a subgraph from `this.changed` (the
modelItems that were just set) and walks `mainGraph.dependantsOf(...)` for
each to find what needs recomputing:

```js
this.changed.forEach(modelItem => {
  if (this.mainGraph.hasNode(modelItem.path)) {
    const all = this.mainGraph.dependantsOf(modelItem.path, false);
    ...
  }
});
```

The just-changed modelItem's path is the *correct* one, `$vars/filtertext[1]`
— but the graph has no node with that key (it only has the mislabeled
`$codelist/filtertext[1]`), so `mainGraph.hasNode(modelItem.path)` is false,
`dependantsOf` is never even called, and `compute()` is never invoked for any
`Row:relevant` path. The `relevant` facet silently never updates again after
the initial (correct, `filtertext=""`) evaluation at load. Confirmed by
patching `model.compute` and `model.recalculate` directly:

```
changedPaths: ["$vars/filtertext[1]"]
dependantsOfEach: [{ path: "$vars/filtertext[1]", dependants: "NO NODE FOR PATH" }]
```

### The fix

`_addDependencies` now resolves each referenced node's *own* instance id via
`model.getInstanceIdForNode()` (a reverse lookup from the node's
`ownerDocument` to the owning `fx-instance`'s id) instead of reusing the
bind's own instance id for every reference (`src/fx-bind.js`, commit
`ac13863f`):

```js
refs.forEach(ref => {
  const refInstanceId = this.model.getInstanceIdForNode?.(ref) ?? instanceId;
  const otherPath = getPath(ref, refInstanceId);
  ...
});
```

See `demo/bind-cross-instance-relevant.html` and
`cypress/e2e/bind-cross-instance-relevant.cy.ts` for the standalone
regression demo/test. Verified directly against `codelist-editor.html` below.

## Confirmed: same-instance binds are NOT affected

A minimal, from-scratch reproduction settles this precisely. Two `fx-bind`s,
identical except for which instance the filtered items live in:

```html
<fx-instance id="data"><data><query/><item><name>Alpha</name></item>...</data></fx-instance>
<fx-instance id="other"><data><item><name>Alpha</name></item>...</data></fx-instance>

<!-- same instance as query -->
<fx-bind ref="instance('data')/item"
          relevant="... instance('data')/query ..."></fx-bind>

<!-- item lives in a different instance than query -->
<fx-bind ref="instance('other')/item"
          relevant="... instance('data')/query ..."></fx-bind>
```

Typing into the query field, with no forced refresh (results before the fix
landed; both rows are ✅ now — see `demo/bind-cross-instance-relevant.html`):

| bind                                  | reactively updates? |
|----------------------------------------|:---:|
| same-instance (`data`/`data`)           | ✅ yes |
| cross-instance (`other`/`data`)         | ❌ no (before fix) → ✅ yes (after fix) |

This is exactly the pattern used by Fore's own [JSON movies explorer
demo](https://jinntec.github.io/Fore/demo/json/json-movies-explorer.html) —
its `query` and `movies` both live in one `instance('data')`, so the bug
never surfaces there:

```html
<fx-instance id="data" type="json">
  { "ui": { "query": "" }, "movies": [...] }
</fx-instance>
<fx-bind ref="?movies?*" relevant="contains(lower-case(?title), lower-case(instance('data')?ui?query))"></fx-bind>
```

`codelist-editor.html` split UI/session state (`selectedfile`,
`exportfilename`, `filtertext`) into a separate `vars` instance from the
loaded genericode data (`codelist`) — a reasonable, arguably preferable
separation of concerns (see "why not colocate" below) — and that split is
exactly what triggers this bug.

## A related, independent limitation: predicates directly on `fx-repeat`'s `ref`

A predicate written directly on the repeat, with no `fx-bind` involved —

```html
<fx-repeat ref="instance('codelist')/SimpleCodeList/Row[contains(...)]">
```

— goes through a completely different code path
(`fx-repeat.js`'s `_evalNodeset()`, called from `refresh()`) and is **not**
part of the recalculate/dependency-graph system at all. It only re-evaluates
when something calls `.refresh()` on the repeat element, which
`Fore.refreshChildren` only does for `force === true` (a full/forced
refresh) — not for the plain recalculate cycle that `fx-control.setValue()`
triggers. This is true regardless of same- vs. cross-instance:

```js
// confirmed on a same-instance predicate — no cross-instance bug involved here at all
await fill(input, 'Alpha');           // repeatCount stays unchanged
await fore.refresh(true);             // repeatCount now correctly filtered
```

So: **`fx-bind[relevant]` is the one that's genuinely designed to be
reactive on ordinary value changes — but only within a single instance.** A
raw predicate on the repeat `ref` needs a forced refresh either way, and an
`fx-var` feeding a repeat's `ref` is subject to the same "only updates on a
forced refresh" limitation (`fx-var` is also a plain `UI_ELEMENT`, refreshed
the same way `fx-repeat` is).

(A separate, now-corrected mistake made while investigating this: placing an
`fx-var` inside `<fx-model>` initially seemed to be its own bug, since
`<fx-model>` sets `inert="true"` on itself and Fore's refresh traversal skips
inert subtrees. That's not a Fore defect, though — `fx-model` is explicitly
not a UI component and was never meant to host something that needs
`.refresh()` called on it; putting a UI-facing `fx-var` there was simply the
wrong place for it, not a framework bug.)

## `filtertext` stayed in `instance('vars')` — colocation was never needed

The obvious *workaround* for bug 1, before it was fixed, would have been to
colocate `filtertext` inside `instance('codelist')` so the bind stayed
single-instance. That was deliberately not done: `instance('codelist')` is
wholesale replaced by `s-load-known`/`s-load-local` (`replace="instance"`)
with the raw genericode XML fetched from disk, and `s-save` serializes that
same instance straight back out to a `.xml` file that's expected to remain
valid, schema-conformant genericode. Adding a scratch UI node into that tree
would mean either scrubbing it back out before every save or accepting that
it leaks into the exported file — real complexity for a project whose whole
purpose is producing clean interchange-format XML. Now that bug 1 is fixed,
this is moot: `filtertext` simply stays in `instance('vars')` where it
belongs, and the cross-instance `fx-bind[relevant]` reacts correctly.

## Bug 2 (fixed): `_processBatchedNotifications` re-scans the whole form once per batched entry

Found while actually driving the fixed cross-instance bind against real
codelists (250–800+ `Row` elements, each with several `Value` children whose
inherited `relevant` also changes — see `modelitem.js`'s "relevant is
inherited down the instance tree" comment, so one `filtertext` keystroke adds
hundreds of entries to `fx-fore.batchedNotifications`, not just one per
`Row`). Typing into the filter box either hung the tab or threw:

```
RangeError: Too many elements passed to Promise.all
    at HTMLElement._processBatchedNotifications (fx-fore.js:1212)
```

Root cause, `src/fx-fore.js`, `_processBatchedNotifications()`: the
"nonrelevant elements need an explicit refresh because the normal recursive
traversal skips them" step lived *inside* the `forEach` over
`batchedNotifications`, even though it doesn't depend on `entry` at all:

```js
this.batchedNotifications.forEach(entry => {
  ...
  const nonrelevant = Array.from(this.querySelectorAll('[nonrelevant]'));  // re-scans the WHOLE form...
  nonrelevant.forEach(el => {
    if (el.refresh) refreshPromises.push(el.refresh());                   // ...and re-pushes a refresh() per element...
  });
  ...
});                                                                        // ...for EVERY entry in the batch.
```

For N batched entries and M currently-nonrelevant elements this pushes
`N × M` redundant `refresh()` promises instead of `M`. Measured on
`UNTDID-1153-3.xml` (817 `Row`s, ~9000 total instance nodes): a single
`filtertext` keystroke produced a batch of ~1700 entries; with ~650 rows
becoming nonrelevant that's over a million redundant promises queued from one
keystroke, which is what actually hung the tab / overflowed `Promise.all`
(confirmed by patching `_processBatchedNotifications` to log `entries ×
nonrelevant` before the fix).

### The fix

Hoisted the nonrelevant scan-and-refresh out of the `forEach`, so it runs
once per batch instead of once per entry (`src/fx-fore.js`):

```js
this.batchedNotifications.forEach(entry => { /* ...per-entry refresh only... */ });

const nonrelevant = Array.from(this.querySelectorAll('[nonrelevant]'));
nonrelevant.forEach(el => {
  if (el.refresh) refreshPromises.push(el.refresh());
});
```

Verified against `Country-Codes-7.xml` (250 rows, filters to 1 match in
~200ms with no error) and `UNTDID-1153-3.xml` (817 rows, filters correctly in
~1s). Full unit suite (966 tests) and the `bind-cross-instance-relevant.cy.ts`
/ `fx-update-orphans-control.cy.ts` / repeat/relevant e2e specs all still
pass after the change.

## Takeaway

- `fx-bind[relevant]` reactively tracking a plain `fx-control` value change is
  correct, documented Fore behavior, **including across `fx-instance`
  boundaries** — bug 1 above is fixed.
- The one remaining scaling caveat: a single value change that flips
  `relevant` on many nodes at once (e.g. a repeat-driving filter over a
  large codelist) used to blow up `_processBatchedNotifications`'s promise
  count quadratically — bug 2 above, also fixed. Filtering large (hundreds+
  of rows) repeats via `fx-bind[relevant]` is now the recommended, reactive,
  idiomatic approach; it no longer needs a plain-JS DOM workaround.
- A predicate directly on `fx-repeat`'s `ref` (with or without a helper
  `fx-var`) is still a different mechanism entirely and only re-evaluates on
  a forced (`force===true`) refresh — unaffected by either fix above, and
  still not the recommended pattern for reactive filtering.
- `codelist-editor.html` now filters via
  `fx-bind[ref="instance('codelist')/SimpleCodeList/Row" relevant="..."]`
  reading `instance('vars')/filtertext`, with
  `fx-repeatitem[nonrelevant] { display: none }` in CSS. This also fixed a
  minor pre-existing gap in the old plain-JS version: the filter now
  automatically re-applies itself when a new codelist is loaded (relevant is
  recomputed as part of the normal rebuild/recalculate cycle), instead of
  needing an explicit `submit-done` listener to manually re-run the filter.
- A raw XPath expression on a control's `ref` (no `fx-bind` backing it, e.g.
  `.kept-count`'s `count(...)`) is *never* dependency-tracked, regardless of
  which instance(s) it reads — it only gets recomputed on a full/forced
  refresh. Bug 3 above worked around this declaratively, by force-refreshing
  that one control from `action-performed`/`value-changed` once a relevant
  change has actually settled, rather than by trying to fold a scalar
  aggregate into the bind/dependency-graph machinery.

## Bug 3 (fixed): `.kept-count` freezes stale on load (and on any bulk `ui-keep` change)

While verifying the above, the `.kept-count` `fx-output`
(`ref="concat(count(instance('codelist')//Row[@ui-keep='true']), ' of ', ...)"`)
reliably showed a stale count (e.g. "29 of 94") right after loading a
codelist, even though the underlying instance data was correct
(`ui-keep='true'` on all 94 `Row`s, confirmed by reading `instance('codelist')`
directly). Reproduced on the pre-existing code too (`git stash` back to
`815e1540`), so this was **not** a regression from bugs 1/2 above — a
separate, pre-existing issue.

### Root cause

`count(...)` is a raw XPath expression on `fx-output`'s `ref`, not backed by
an `fx-bind`. It is therefore never registered in `DepGraph`/`mainGraph`, so
`fx-model.recalculate()` never includes it when walking `dependantsOf(...)`
for a changed node, and Fore's normal partial-refresh path
(`_processBatchedNotifications()`, driven by `fx-fore.batchedNotifications`)
never touches it. It only gets re-evaluated by a *full* (`force===true`)
refresh, of which there is exactly one during a codelist load — triggered by
`replace="instance"` inside `fx-submission._handleResponse()` — and that
happens **before** the `submit-done`-triggered `fx-setattribute[iterate]`
that stamps `ui-keep="true"` onto every `Row` has run. Confirmed directly by
patching `fx-output.updateWidgetValue()`/`fx-fore.refresh()` and logging
every call: on a 179-row load, `.kept-count` was refreshed exactly twice —
once mid-way through the still-running `iterate` loop (landing on whatever
row count had been stamped by that point, e.g. "29 of 179") and never again,
regardless of dataset size (250, 179, 211, 817 rows all reproduced the same
kind of stuck, partial count). The same non-tracking applies to `select
all`/`select none`/`invert selection`/individual checkbox toggles/`remove
unchecked rows` — none of them touch `.kept-count` either, since none of
their target nodes (`@ui-keep`) are dependencies it's registered for.

### The fix

Rather than changing framework dependency-graph/refresh internals (risking
the kind of quadratic blowup fixed in bug 2), `.kept-count` is force-refreshed
declaratively from two DOM events that Fore already dispatches once a data
change is fully settled, both at the `<fx-fore>` root
(`demo/codelists/codelist-editor.html`):

```js
const refreshKeptCount = () => document.getElementById('kept-count').refresh(true);
document.getElementById('fx-codelist-editor').addEventListener('action-performed', refreshKeptCount);
document.getElementById('fx-codelist-editor').addEventListener('value-changed', refreshKeptCount);
```

Two events are needed because Fore's action system has two distinct
"a change just settled" signals depending on where the action lives:

- **`action-performed`** — dispatched by `AbstractAction.dispatchActionPerformed()`
  once `_finalizePerform()` runs on the *outermost* handler, i.e. only after
  the entire pending action chain (including any nested `iterate` loop) has
  resolved and `model.recalculate()`/`revalidate()` have run. This covers
  loading a codelist (fires on `<fx-send>` once `submission.submit()` -
  including the nested, `submit-done`-triggered `fx-setattribute[iterate]` -
  has fully resolved), select all/none, invert, and remove-unchecked (each is
  itself the outermost handler for its own click).
- **`value-changed`** — dispatched by `abstract-control.js`'s `refresh()`
  on the `fx-control` element itself (light DOM, so it bubbles normally).
  Needed because the per-row keep checkbox commits via
  `fx-control.setValue()`, which runs its `<fx-setvalue>` action straight
  from `this.shadowRoot` (see `src/ui/fx-control.js`) - `Fore.dispatch()`
  always sets `composed: false`, so that action's own `action-performed`
  never crosses the shadow boundary and would never reach a light-DOM
  listener on `#fx-codelist-editor`.

`fx-output.refresh(true)` is cheap (one XPath `count()` over the loaded
codelist), so calling it slightly more often than the strict minimum (e.g.
once per keystroke-driven `fx-setvalue` elsewhere in the form) is not a
performance concern the way bug 2 was.

Verified live (Playwright) against `Country-Codes-7.xml` (250 rows) and
`UNTDID-1153-3.xml` (817 rows): count is correct immediately after load,
after select all/none/invert, after removing unchecked rows, and after
toggling a single row's checkbox.
