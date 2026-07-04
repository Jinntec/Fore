# Undo/redo for Fore instance data — summary

Status: implemented and hardened, **not yet committed**. Covered by 958 unit tests
(`test/undo-redo.test.js`, 48 cases) and 6 Cypress e2e tests
(`cypress/e2e/undo-redo.cy.js`) against `demo/undo-redo.html`.

## What it does

Every action chain (`fx-setvalue`, `fx-insert`, `fx-delete`, `fx-reset`, `fx-replace`,
instance-replacing `fx-send`, `fx-upload`, drag-and-drop reordering) and every direct widget
edit through `fx-control` can be undone and redone. Rapid edits to the same node (typing)
coalesce into a single undo step, like a text editor.

Opt-in and zero-cost when unused:

```html
<fx-model undo undo-depth="50">
```

- `undo` — master switch. Off by default; without it `UndoManager` never clones anything.
- `undo-depth` — max stack size (default 50). Only takes effect combined with `undo`.

New action elements:

```html
<fx-trigger><button>undo</button><fx-undo></fx-undo></fx-trigger>
<fx-trigger><button>redo</button><fx-redo></fx-redo></fx-trigger>
```

fire `undo-done` / `redo-done` with `{canUndo, canRedo}` in the detail.

Optional keyboard shortcuts, opt-in per `<fx-fore>` (overrides native text-field undo, hence
opt-in):

```html
<fx-fore keyboard-shortcuts>
```

Ctrl/Cmd+Z → undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y → redo.

## How it works

- **`src/UndoManager.js`** — one instance per `FxModel` (`model.undoManager`). Snapshot-based
  (memento pattern, not a command/operation log — see "Design choice" below): `beginCapture()`
  clones every instance in the model (`cloneNode(true)` for XML, `structuredClone()` for JSON)
  before a chain runs; `commit()` pushes that clone onto the undo stack once the chain actually
  mutated something; chains that end without a mutation are discarded.
- **Chain boundary**: hooked into `AbstractAction.execute()` / `_finalizePerform()`
  (`src/actions/abstract-action.js`) at the exact point where `FxFore.outermostHandler` is
  acquired/released — nested/sequenced actions within one synchronous chain already share this
  boundary, so one undo step per user-visible operation falls out for free.
- **`FxModel.getEffectiveUndoManager()`** — a model with zero `<fx-instance>` of its own (a
  nested `fx-fore` that only consumes an ancestor's `shared` instance) delegates to the nearest
  ancestor that actually owns instances, so its undo/redo correctly operates on the shared data
  instead of silently recording empty snapshots.

## Hardening pass (this session)

The initial implementation passed its own tests but hadn't been stress-tested against edge
cases. A self-assessment turned up concrete gaps, all now closed or explicitly documented:

| # | Issue | Resolution |
|---|---|---|
| 1 | Reentrancy: a rapid double-click on the same (singleton, reused) action element could permanently strand `FxFore.outermostHandler` and silently drop an undo commit — a pre-existing framework hazard that undo's correctness now depended on. | Outermost-acquisition state moved from a shared instance property to a local variable threaded through `execute()`/`_finalizePerform()`. Added a `_busy` guard on `fx-undo`/`fx-redo` as defense in depth. |
| 2 | `fx-send`'s instance-replacing submissions never set `needsUpdate` (deliberately, to avoid a double refresh) — the generic hook saw no change and discarded every such edit. | Set `needsUpdate = true` and added an `actionPerformed()` override that skips the now-redundant default cycle, matching the `fx-reset` pattern. |
| 3 | `fx-upload` and drag-and-drop reordering (`withDraggability._drop()`) bypass `AbstractAction` entirely — the generic hooks never fired for them. | Added explicit `beginCapture()`/`commit()` around each. The `fx-droptarget` branch (pure light-DOM element reordering, no instance data involved) is correctly left unwrapped. |
| 4 | A model that owns *some* instances of its own but also mutates an unrelated `shared` instance elsewhere (the "mixed" case) isn't covered by `getEffectiveUndoManager()` — edits to the outside instance are silently un-tracked. | Scoped decision: diagnostic only. `UndoManager` logs a one-time `console.warn` instead of silently mis-tracking. Full fix (keying undo history by instance instead of by model) documented as a deferred follow-up. |
| 5 | No test coverage for JSON-type instances (`type="json"`) — every original test used XML. | Added setvalue undo/redo, coalescing, and mixed XML+JSON-in-one-model tests. |
| 6 | No coverage of long undo/redo sequences or repeated undo→mutate→redo cycling. | Added a 20-step stress test with start/middle/end checkpoints, and a 5-cycle test confirming redo-stack invalidation holds under repetition, not just once. |
| 7 | No test of undo/redo crossing a validation (valid/invalid) boundary. | Added a test asserting `ModelItem.constraint` and the `valid`/`invalid` events/attribute update correctly across an undo that restores a previously-valid value. |
| 8 | Clone-cost-at-scale was an assumption, not a measurement. | Benchmarked (see below) — no cause for concern at realistic sizes. |

## Performance (measured, Chrome)

`UndoManager.beginCapture()` + `commit()`, per undo step:

| Document size | XML | JSON |
|---|---|---|
| 500 elements/items | ~0.3 ms | ~0.4 ms |
| 2,000 | ~1.1 ms | ~1.4 ms |
| 5,000 | ~3.4 ms | ~4.4 ms |

Scales linearly, no cliff. Even a 5,000-element document — a genuinely large form — stays
under 4 ms per step. No optimization needed at realistic Fore document sizes.

## Design choice: snapshot, not a command/operation log

Considered and rejected (for now) an alternative design: recording each mutation as an
invertible operation (à la ProseMirror) instead of cloning whole documents. Rejected because:

- The snapshot approach is correct *by construction* — restoring a serialized state can't be
  subtly wrong. An operation log is only as correct as every action type's hand-written inverse
  (insert/delete need stable node identity across index shifts, replace needs to store what was
  replaced, etc.) — a much larger surface for silent corruption bugs.
- It wouldn't actually save the expensive part: `recalculate()`/`revalidate()` still has to run
  after applying an inverse operation regardless of how the raw data change was represented.
- The measured clone cost (above) doesn't justify the added risk and engineering cost.

If a future app's usage pattern genuinely needs cheaper per-step undo, the cheaper intermediate
step is snapshotting only the instance(s) an edit's coalesce-key node actually belongs to,
rather than always cloning every instance in the model — a small change to
`UndoManager._snapshot()`, not a rewrite.

## Known limitations (documented, not fixed)

Full detail in `doc/shared-instance-refresh-investigation.md`:

- **Mixed shared+local instances** (hardening item 4 above): diagnostic warning only, not a
  full fix.
- **`FxFore.outermostHandler` is a page-global static**: two independent `<fx-fore>` forms with
  genuinely overlapping async action chains (via `delay`/`while`) can still cause one to miss a
  capture. Rare in practice; documented as a residual framework-level limitation.
- **Pre-existing, unrelated bug found while testing drag-drop**: `withDraggability._drop()`'s
  reorder logic compares DOM `previousSibling` directly against the dragged node; whitespace
  text nodes between XML elements (e.g. from indented markup) break that comparison and
  silently no-op the reorder. Not caused by, or specific to, undo/redo.
- **Rapid *programmatic* edits immediately after undo/redo**: `fx-undo`/`fx-redo` trigger a
  fire-and-forget `refresh(true)`; a script that calls `setValue()` again before that refresh
  settles can see `isRefreshing === true` and skip capture for that edit. Not reachable at
  human click/typing speed — only matters for automated/scripted interaction.
- **A nested `fx-fore` with no `<fx-instance>` of its own** doesn't reliably refresh its own UI
  after a *partial*-cycle action targeting a shared instance (the underlying data and the
  undo/redo mechanism are both correct; only the display can lag until the next full refresh —
  which is exactly what `fx-undo`/`fx-redo` themselves force, so undo/redo through the buttons
  is unaffected). Root-caused but not fixed; see the investigation doc for the exact mechanism
  and suggested next steps.

## Files

- `src/UndoManager.js` (new)
- `src/actions/fx-undo.js`, `src/actions/fx-redo.js` (new)
- `src/actions/abstract-action.js`, `src/fx-model.js`, `src/fx-fore.js`, `src/ui/fx-control.js`,
  `src/actions/fx-send.js`, `src/ui/fx-upload.js`, `src/withDraggability.js` (modified)
- `index.js` (two new imports)
- `test/undo-redo.test.js` (new, 48 tests)
- `cypress/e2e/undo-redo.cy.js` (new, 6 tests)
- `demo/undo-redo.html` (new)
- `doc/shared-instance-refresh-investigation.md` (new — the UI-refresh gap and the mixed-
  instance follow-up)
