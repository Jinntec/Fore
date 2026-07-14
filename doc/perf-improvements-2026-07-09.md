# Performance improvements — since "optimize XPath-based path computation"

**Range:** `ab59017a` → `d3ce2a19` (9 commits, 2026-07-09 16:46 → 2026-07-10 10:28)

## Headline number (measured, not estimated)

Loading the **UNTDID 1001** codelist (802 rows) in `demo/codelists/codelist-editor.html` —
the scenario these fixes specifically target:

| | Before (`ab59017a^`) | After (`bda1a645`, HEAD) | Change |
|---|---|---|---|
| Wall-clock load time | **14.4 s** | **4.9 s** | **~3× faster** (−66%) |
| `evaluateXPathToString` calls | **1,300,856** | **17,656** | **73× fewer** |

Methodology: checked out the pre-optimization commit into a separate git worktree, ran both
versions' Vite dev servers side by side, drove the same UI action (select "UNTDID 1001" →
wait for all 802 rows to render and stabilize) via Playwright in both, and instrumented
`evaluateXPathToString` with a call counter to verify the algorithmic claim directly rather
than trusting wall-clock time alone (which is noisy — DOM rendering and console logging
dominate the constant factor, so the counter is the cleaner signal of *why* it's faster).

## What actually changed, by commit

### `ab59017a` — native DOM traversal for path computation
Added `nativeDocPath()` in `src/xpath-path.js`: computes the same path string fontoXPath's
`path()` produces (e.g. `/Row[42]`), but via plain DOM sibling-walking instead of invoking
the XPath engine. `getDocPath()`/`getPath()` fall back to fontoXPath only for node shapes
`nativeDocPath()` isn't confident about. These two functions are called once per node during
bind-graph construction and inside every `iterate` action — so this removes fontoXPath's
fixed per-call overhead (query compile/interpret, dynamic context, domFacade) from what was
previously an 800+-times-per-load hot path.

### `3806097c` — fix O(N²) in dependency-graph construction (the big one)
`FxBind.getReferences()` / `_getReferencesForProperty()` used to evaluate a bind's
expression (e.g. its `relevant` clause) against **every node in the bind's nodeset**, and
did so **once per node** in the outer loop — an N×N blowup. For an 802-row bind that's
802 × 802 ≈ 643k evaluations for a single facet. Fixed by passing the single context node
through instead of re-scanning the whole nodeset each time. Also fixed a correctness bug
alongside the perf one: the old approach leaked dependencies from *every other* row into
each row's tracked references, not just its own.

### `cb7e302b` — test coverage
Added unit tests for `getDocPath`/`getPath` (element, attribute, text, comment, processing-
instruction, nested paths, instance-id prefixing). Protects the new native fast path in
`ab59017a` from regressing back to the slow one silently.

### `a5f90d8b` — demo-level: skip a full 802-row pass when it's a no-op
In the codelist-editor demo's reconciliation logic, an `fx-setvalue` was unconditionally
looping over every row to (mostly) rewrite the same `'true'` value already set by the
previous step. Moved the "is reconciliation even needed" check into the `iterate` expression
itself, so a plain load (no prior custom codelist to reconcile against) skips the loop
entirely instead of doing 802 no-op writes (each triggering its own `notify()`).

### `9349945d` — skip a redundant refresh cycle on submission replace
`fx-send`'s handling of `replace="instance"` responses always ran its own
`updateModel()` + `refresh(true)` after `submission.submit()` — duplicating the cycle that
`fx-submission#_handleResponse()` already runs internally once the model is initialized.
Now it only runs that extra cycle for the one case that actually needs it (model not yet
inited). Cuts one full rebuild/recalculate/revalidate/refresh pass off every subsequent
instance-replacing submission.

### `4b55fc0e` — accessibility only, no perf impact
Labels/alt-text additions in demo markup.

### `bda1a645` — shared stylesheet caching + repeat-clone waste removal
Two independent fixes, both matter for repeated rows (`fx-repeat`):
- **CSS**: `Fore.getSharedStyleSheet()` parses each distinct `<style>` block once (via
  `CSSStyleSheet` + `replaceSync`) and shares it across instances through
  `shadowRoot.adoptedStyleSheets`, instead of every `fx-control`/`fx-output`/`fx-repeat`
  instance re-parsing an identical stylesheet via `shadowRoot.innerHTML`. For 802 rows with
  a couple of controls each, that's roughly a thousand fewer CSS parses.
- **`_initRepeatItems()`**: was cloning and clearing the nodeset of *every* row on each
  rebuild to prepare `createdNodeset` (the insert template for a new row) — but only the
  last iteration's clone is ever read. Now only the last row is cloned. For the UNTDID 1001
  codelist that's 1 clone instead of 800.

### `d3ce2a19` — O(N) ModelItem lookups → O(1), plus removal of hot-path console logging
Two more fixes in the same family as `3806097c` — replacing linear scans over
`modelItems` with indexed lookups:

- **Indexed lookups.** `FxModel` now maintains `_modelItemsByPath` (path → ModelItem)
  and `_modelItemsByKey` (backing node/lens → ModelItem) maps alongside the existing
  `modelItems` array. Previously, `registerModelItem()`, `deregisterModelItem()`, the
  rebuild-time retarget pass, and `ForeElementMixin`'s bind step all located a
  ModelItem via `modelItems.find(mi => mi.path === path)` or
  `modelItems.findIndex(mi => mi.node === node || mi.lens === node)` — an O(N) scan
  per node, on top of the per-node work already done during `rebuild()`. For an
  802-row bind this turns what was an implicit second N² risk (scan cost compounding
  with bind count) into O(1) map gets/sets. All index mutation is now centralized in
  four helpers (`_indexModelItem`, `_deindexModelItem`, `_setModelItemPath`,
  `_setModelItemTarget`) so the array and the two maps can't drift out of sync —
  `fx-repeat.js`/`repeat-base.js`'s path-rewrite step (the "dewey rewrite" for
  inserted rows) and `FxModel`'s retarget-on-rebuild path were updated to go through
  these instead of mutating `mi.path`/`mi.node`/`mi.lens` directly.
- **Console logging removed.** All development `console.log`/`console.info` calls
  are gone from `fx-model.js`, `fx-fore.js`, and `UIElement.js` — including one on
  every `refresh-done` that dumped the *entire* `modelItems` array to the console.
  This directly removes one of the two confounders this document's own methodology
  section called out ("DOM rendering and console logging dominate the constant
  factor") — wall-clock comparisons against pre-`d3ce2a19` builds are no longer
  penalized by that logging overhead.

Not independently re-benchmarked with the same Playwright/counter methodology as the
headline number above; the change is a straightforward algorithmic class match to
`3806097c` (O(N) scan → O(1) map lookup) rather than a new technique, so no separate
measurement was taken.

## Net effect

The dependency-graph fix (`3806097c`) is the dominant contributor — it's what turns
1.3M XPath evaluations into 17.7k. The native-path fix (`ab59017a`) removes fontoXPath's
per-call fixed cost from the (now much smaller) number of calls that remain. The demo-level
fix (`a5f90d8b`) and the submission fix (`9349945d`) each remove one additional full
802-row pass from this specific load flow. The stylesheet-caching and clone-avoidance fix
(`bda1a645`) targets rendering cost rather than XPath evaluation, so it compounds with the
above on any large `fx-repeat`. The ModelItem-indexing fix (`d3ce2a19`) closes off the
remaining O(N) scan sites (`registerModelItem`, `deregisterModelItem`, path rewrites during
repeat inserts) that `3806097c` didn't touch, and its console-log removal eliminates the
logging overhead this document's own methodology called out as a confound in wall-clock
measurements.

All of this is scoped to workloads with large sibling/repeat groups — small forms won't
show a measurable difference, since the fixed per-load overhead (initial model
construction, DOM rendering) dominates at low N. (Console logging no longer contributes
to that fixed overhead as of `d3ce2a19`.)
