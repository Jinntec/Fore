# Broken or flaky demos:

## open

(* fx-lens does not play with demo-snippet-vanilla yet)

### controls/ui.html
Missing `<script>` tag entirely - no version of Fore is loaded, so none of its custom elements
(`fx-fore`, `fx-group`, `fx-control`) ever upgrade. Also references model paths (`to/email`,
`subject`, `message`, `attachments`) with no `<fx-model>`/`<fx-instance>` defining them, and had a
stray `<<fx-fore>` typo (fixed in passing while investigating). Found while wiring up an
automated axe accessibility check (see ACCESSIBILITY.md), which is why the check targets
`controls/email.html` instead.

### fx-update-orphans-control.html (new demo, documents a real bug)
An `fx-control` with `<fx-update event="value-changed">` (the documented way to trigger a full
update cycle whenever a value changes) only fires `value-changed` -- and re-renders any UI element
bound to that same node -- for the *first* value commit. After that it's stuck forever, with no
error. Confirmed this is **not** a whole-page freeze: an unrelated `fx-bind[calculate]` node,
recomputed fresh on every keystroke, keeps updating the entire time; only UI bound to the node
whose own change triggered the `<fx-update>` gets stuck.

Root cause: `<fx-update>` calls `model.updateModel()` -> `rebuild()`, which retargets ModelItems by
path while the very node whose change triggered the update is mid-flight. That node's bound-UI-
element/observer list doesn't survive the retarget; every other ModelItem, built fresh with no
concurrent write in flight, keeps working. The raw instance data and the widget's own displayed
value stay correct throughout (the widget->model `setValue()` direction is unaffected) -- only the
model->widget `refresh()` direction (where `value-changed` is dispatched) breaks, which is why the
bug is easy to miss just by looking at the page.

See `cypress/e2e/fx-update-orphans-control.cy.ts` for a passing regression test.

## fixed

### bind-cross-instance-relevant.html (cross-instance dependency canonicalization)
An `fx-bind`'s `relevant` (and, via the same code path, `calculate`/`required`/`constraint`) facet
did not reactively recompute when the expression referenced a node in a *different* `fx-instance`
than the bind's own `ref`. Confirmed same-instance binds reacted correctly (control group in the
demo) -- this isolated the bug to instance-crossing specifically.

Root cause: `fx-bind.js`'s `_buildBindGraph()` resolved `instanceId` once from the bind's own
`ref`, then reused that id via `_addDependencies()` to canonicalize the path of every node the
`relevant` expression referenced -- including references into a different instance, which got a
canonical path (e.g. `$codelist/filtertext[1]`) that didn't match the real node's path anywhere
else in the model. `recalculate()`'s "changed" subgraph walk (`mainGraph.dependantsOf(...)`) then
never found the bind, so `compute()` was never invoked for it again after the initial evaluation.

Resolution: `_addDependencies()` now resolves each referenced node's *own* instance id via a new
`FxModel.getInstanceIdForNode()` reverse lookup (matches the node's `ownerDocument` against each
registered `fx-instance`'s document) instead of reusing the bind's own instance id for every
reference. `model.updateModel()` + `fore.refresh(true)` remains a valid (if heavier) recovery path
for the same class of stuck-graph issue but is no longer needed for this case.

See `cypress/e2e/bind-cross-instance-relevant.cy.ts` for the regression test (now asserting fixed
reactive behavior for both the same-instance and cross-instance panels).

### shared-instances.html (insert behavior when adding to child)
largely resolved but still requires some hard refreshes. Could be 
improved. Further template expression in sibling repeat is not 
updating immediately after insert but with next refresh but can be considered
a minor issue.

### selects.html - updating silly error in demo using 'australia' instead of 'australasia'

### fx-output markdown should update
has an explicit refresh to outputting md but seems acceptable for now

### on-demand-repeat.html
### group-relevance.html

### i18n2.html

fixed and tested
Resolution:
submission replace instance fires explicit hard refresh (see reset)

### reset.html
Resolution:

does hard refresh now but is justified here (might still have some potential considering the target instance of the reset)

### fx-replace.html

Resolution:
- does a hard refresh for now and remains an area of work

### create-nodes/multi-step.html

properly creates modelitems in repeat but revealed an issue in create-nodes itself creating unwanted parent element
-> TaxCategory

delete does not cleanup child modelitems
