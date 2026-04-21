# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fore** (`@jinntec/fore`) is a declarative UI framework built on HTML5 Web Components, implementing XForms 2.0 concepts for model-driven form and app development. Behavior is defined entirely by Web Components — no JavaScript required for basic forms.

## References
    - [Fore documentation](https://jinntec.github.io/fore-docs/tags/version-1.0.0/) — official element/attribute reference

## Commands

```bash
npm start                    # Dev server on port 8090 (Vite)
npm run build                # Production bundles → dist/fore.js and dist/fore-dev.js
npm test                     # Run unit tests once (headless Karma/Mocha)
npm run test:watch           # Watch mode
npm run lint                 # ESLint + Prettier check
npm run format               # Auto-fix ESLint + Prettier
npm run lint:types           # TypeScript type checking via JSDoc
npm run docs                 # Generate Web Component Analyzer docs
```

**Running a single test file**: Karma doesn't support single-file targeting directly; edit `karma.conf.js` to narrow the `files` glob, or use Cypress for E2E: `npm run start-cypress` then open the Cypress UI.

## Architecture

### Update Cycle (XForms pattern)
Every data change triggers: **Rebuild → Recalculate → Revalidate → Refresh**. This is the central mechanism in `fx-fore.js` and `fx-model.js`.

### Core Components

| File                                  | Role                                                                                                          |
|---------------------------------------|---------------------------------------------------------------------------------------------------------------|
| `src/fx-fore.js`                      | Root `<fx-fore>` element — form lifecycle, update cycle, event dispatch                                       |
| `src/fx-model.js`                     | `<fx-model>` — holds instances and ModelItems, drives recalculate/revalidate                                  |
| `src/fx-bind.js`                      | `<fx-bind>` — declarative constraints (`calculate`, `constraint`, `required`, `readonly`, `relevant`, `type`) |
| `src/fx-instance.js`                  | Data container (XML or JSON)                                                                                  |
| `src/fx-submission.js`                | `<fx-submission>` — wraps fetch API for submitting/loading data                                               |
| `src/modelitem.js`                    | `ModelItem` — per-node state wrapper (valid, relevant, readonly, required); notifies UI observers             |
| `src/ForeElementMixin.js`             | Base mixin mixed into every Fore element                                                                      |
| `src/dep_graph.js`                    | Dependency graph used to optimize partial updates                                                             |
| `src/DependencyNotifyingDomFacade.js` | XPath facade that records which nodes an expression reads                                                     |
| `src/fore.js`                         | Static utility class                                                                                          |
| `src/xpath-path.js`                   | XPath path resolution                                                                                         |
| `src/xpath-evaluation.js`             | XPath evaluation with fontoXPath                                                                              |

**Actions** (`src/actions/`) — `fx-setvalue`, `fx-insert`, `fx-delete`, `fx-send`, `fx-dispatch`, `fx-refresh`, `fx-show/fx-hide`, and ~15 more. Each action class responds to DOM events.

**UI Components** (`src/ui/`) — `fx-control`, `fx-repeat`, `fx-group`, `fx-output`, `fx-switch/fx-case`, `fx-trigger`. Controls bind to ModelItems via `ref` XPath expressions.

### Data Model
- **Primary**: XML with XPath 3.1 / XQuery 3.1 (via `fontoxpath`)
- **Alternative**: JSON with JSONPath-like access (`src/json/`)
- Both can coexist in one application

### Dependency Tracking
`DepGraph` + `DependencyNotifyingDomFacade` record which XPath expressions read which data nodes. On change, only affected ModelItems and UI controls are updated.

### Entry Point
`index.js` — imports and registers all Web Components with `customElements.define`.

## Key Conventions

- All source is plain ES6+ JavaScript with JSDoc; there is no TypeScript source (type checking runs against JSDoc annotations).
- The `dev` branch is for active development; `master` is for releases.
- Tests live in `test/` and follow the pattern `<feature>.test.js`.
- Demos live in `demo/` and serve as living documentation.