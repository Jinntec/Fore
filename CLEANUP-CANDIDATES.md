# Demo cleanup candidates

Not deleted — for manual review. Each link opens via the local dev server (`npm start`, port 8090). Reasons are from an automated review; verify before deleting.

Files marked **(cross-checked safe)** had no references found in tests, other demos, or the playground picker as of this review. A few flagged files were found to be genuinely load-bearing (real Cypress tests, or loaded as fragments by curated demos) and were excluded from this list entirely — they are NOT candidates for deletion.

## Superseded / duplicate of a curated or better demo
- [controls/ui-component.html](http://localhost:8090/demo/controls/ui-component.html) — byte-identical duplicate of curated `controls/fx-fore.html`
- [codemirror.html](http://localhost:8090/demo/codemirror.html) — title/content mismatch, codemirror bits commented out; superseded by curated `codemirror/codemirror.html`
- [codemirror-raw.html](http://localhost:8090/demo/codemirror-raw.html) — older, broken CDN links; superseded by `codemirror/codemirror.html`
- [codemirror/epidoc.html](http://localhost:8090/demo/codemirror/epidoc.html) — stub, fields point at placeholder data; superseded by `edep/edit.html`
- [tei-header.html](http://localhost:8090/demo/tei-header.html) — older iteration of curated `simple-tei-header.html`
- [simple-tei-header-1.html](http://localhost:8090/demo/simple-tei-header-1.html) — older iteration of curated `simple-tei-header.html`
- [simple-tei-header-2.html](http://localhost:8090/demo/simple-tei-header-2.html) — older iteration of curated `simple-tei-header.html`
- [simple-tei-header-3.html](http://localhost:8090/demo/simple-tei-header-3.html) — older iteration of curated `simple-tei-header.html`
- [datalist/ajax-datalist.html](http://localhost:8090/demo/datalist/ajax-datalist.html) — same concept as curated `dyn-datalist.html`
- [controls/track.html](http://localhost:8090/demo/controls/track.html) — thin wrapper embedding `duration.html`
- [foreign-samples/fore-map.html](http://localhost:8090/demo/foreign-samples/fore-map.html) — legacy XSLTForms-flavored markup, incompatible with current Fore
- [foreign-samples/map.html](http://localhost:8090/demo/foreign-samples/map.html) — same as above
- [graph/recalculate.html](http://localhost:8090/demo/graph/recalculate.html) — redundant with curated `graph/subgraph.html`
- [graph/calc.html](http://localhost:8090/demo/graph/calc.html) — redundant with curated `graph/subgraph.html`
- [graph/fore-graph.html](http://localhost:8090/demo/graph/fore-graph.html) — redundant with curated `graph/subgraph.html`
- [graph/graph.html](http://localhost:8090/demo/graph/graph.html) — thinner early version of curated `graph/subgraph.html`
- [combined-constraint.html](http://localhost:8090/demo/combined-constraint.html) — superseded by `tei/person.html`; also depends on undefined external elements
- [instances-json.html](http://localhost:8090/demo/instances-json.html) — superseded by curated `04-instances.html` (also listed in the playground's example picker — remove that `<demo>` entry too if deleting)
- [instances.html](http://localhost:8090/demo/instances.html) — superseded by curated `03-instances.html`
- [load-instance.html](http://localhost:8090/demo/load-instance.html) — superseded by curated `03-instances.html`
- [query-instance.html](http://localhost:8090/demo/query-instance.html) — superseded by curated `04-instances.html`
- [json/json-binding.html](http://localhost:8090/demo/json/json-binding.html) — earlier/thinner draft of `json/json-repeat-binding.html`
- [json/json-lazy-binding.html](http://localhost:8090/demo/json/json-lazy-binding.html) — earlier/thinner draft of `json/json-repeat-binding.html`
- [nested-bind.html](http://localhost:8090/demo/nested-bind.html) — trivial subset of curated `binding.html` (also in the playground's example picker)
- [nested-fore-instance.html](http://localhost:8090/demo/nested-fore-instance.html) — byte-identical duplicate of `nested-default-vars.html`
- [output-html.html](http://localhost:8090/demo/output-html.html) — subset of `output.html`
- [output.html](http://localhost:8090/demo/output.html) — overlaps curated `controls/fx-output.html` (also in the playground's example picker)
- [repeat-sequence.html](http://localhost:8090/demo/repeat-sequence.html) — superseded by curated `repeat-atomic.html`
- [switch-nested.html](http://localhost:8090/demo/switch-nested.html) — near-duplicate of curated `auth.html`
- [task/period-template.html](http://localhost:8090/demo/task/period-template.html) — orphaned, unreferenced fragment
- [todo-1.html](http://localhost:8090/demo/todo-1.html) — early superseded draft of `todo2.html`
- [todo-2.html](http://localhost:8090/demo/todo-2.html) — early superseded draft of `todo2.html`
- [todo.html](http://localhost:8090/demo/todo.html) — early superseded draft of `todo2.html`
- [lab/recalculate.html](http://localhost:8090/demo/lab/recalculate.html) — confirmed (diffed) superseded dupe of curated `recalculate.html`
- [lab/work-plan.html](http://localhost:8090/demo/lab/work-plan.html) — empty stub, no bound content

## Broken
- [editor/edit-html.html](http://localhost:8090/demo/editor/edit-html.html) — references undefined custom element `<jinn-xml-editor>`
- [hello.html](http://localhost:8090/demo/hello.html) — malformed markup, unclosed `<fx-message>` tag
- [sample.html](http://localhost:8090/demo/sample.html) — broken scaffold (`<fx-moodel>` typo), explicit "use as base" template
- [test-jsdelivr.html](http://localhost:8090/demo/test-jsdelivr.html) — script `src` points at a jsdelivr package page, not a JS file
- [duration.html](http://localhost:8090/demo/duration.html) — contains malformed `<<fx-instance` tag
- [template-factory.html](http://localhost:8090/demo/template-factory.html) — references undefined `paper-input` custom element, never imported

## Dev/debug scratch or one-off internal probes
- [core-functions.html](http://localhost:8090/demo/core-functions.html) — deliberately-broken "this doesn't work" bug demo
- [create-attr.html](http://localhost:8090/demo/create-attr.html) — internal design probe for lazy node creation
- [create-element.html](http://localhost:8090/demo/create-element.html) — internal design probe, same purpose as above
- [editor/editor.html](http://localhost:8090/demo/editor/editor.html) — half-finished drag/drop Fore-builder, drop handling commented out; superseded by `fore-editor.html`
- [datalist-multiple/demo-autocomplete.html](http://localhost:8090/demo/datalist-multiple/demo-autocomplete.html) — not a Fore demo at all, orphaned vanilla-JS reference snippet
- [bookmarklet.html](http://localhost:8090/demo/bookmarklet.html) — empty stub
- [diacritics.html](http://localhost:8090/demo/diacritics.html) — a Chrome browser-bug repro, not a Fore feature demo
- [zen-quotes.html](http://localhost:8090/demo/zen-quotes.html) — title/content mismatch, static JSON not a live API

## Excluded from this list — do NOT delete
These looked like cleanup candidates on the surface but turned out to be load-bearing:
- `json/json-movies-explorer-2.html`, `fx-fore/wait-for-sibling.html`, `bind-cross-instance-relevant.html`, `fx-update-orphans-control.html`, `controls/email-test.html`, `create-nodes/bug.html`, `perf/large-repeat.html` — each has a real Cypress spec (`cypress/e2e/*.cy.ts`) that visits it directly.
- `submission-consumer.html` — linked from the curated `submission-localStore.html` demo.
- `lab/clock2.html`, `lab/todo2.html` — embedded via `src=` inside the curated `lab/fore-component.html` demo.
