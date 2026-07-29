# Fore Compared to Popular Form Frameworks

## Executive Summary

Fore occupies a rather unusual position in the landscape. Most popular
frameworks evolved from a JavaScript-first mindset where the data model
is an object manipulated imperatively. Fore instead descends
conceptually from XForms: **the model is the primary artifact and the UI
is a declarative projection of it.**

That difference has consequences across architecture, build effort,
runtime behavior, maintainability and AI-assisted development.

## High-Level Comparison

| Aspect | Fore | React + React Hook Form | Angular Forms | Vue + VeeValidate | SurveyJS / Form.io |
| --- | --- | --- | --- | --- | --- |
| Programming model | Model-driven | Component-driven | Component-driven | Component-driven | Configuration-driven |
| Data model | XML/JSON instance | JS state | JS objects | JS objects | JSON schema |
| Binding | Declarative XPath | Imperative hooks | Reactive bindings | Reactive bindings | Generated |
| Validation | Declarative model constraints | JS functions | JS validators | JS validators | Schema rules |
| Calculations | XPath expressions | JavaScript | TypeScript | JavaScript | Limited expressions |
| Repeat handling | Data-driven | `map()` rendering | `*ngFor` | `v-for` | Generated |
| Dependencies | Automatic | Manual | Mostly manual | Mostly manual | Generated |

------------------------------------------------------------------------

# Architecture

## React Ecosystem

``` text
State
   ↓
Component
   ↓
Render()
   ↓
DOM
```

Business rules are typically distributed across:

-   Components
-   Hooks
-   Reducers
-   Validators
-   Effects

The data model largely exists because components need it.

## Fore

``` text
Model
   ↓
Bindings
   ↓
UI Controls
```

Business rules live together:

-   Constraints
-   Calculations
-   Relevance
-   Readonly
-   Required
-   Actions

The UI becomes a projection of the model.

For structured applications (TEI, FHIR, XML, complex JSON) this
separation scales particularly well.

------------------------------------------------------------------------

# Build Effort

  Framework   Build Required
  ----------- --------------------
  React       Always
  Angular     Mandatory
  Vue         Practically always
  Svelte      Mandatory
  Fore        Optional

A Fore application can simply be:

``` html
<script type="module" src="fore.js"></script>

<fx-fore>
...
</fx-fore>
```

No transpiler.

No bundler.

No compiler.

Production deployments may still bundle assets, but the framework itself
does not require a build pipeline.

This greatly lowers the barrier for:

-   CMS integration
-   XML editors
-   eXist-db applications
-   Static websites
-   Rapid prototyping

------------------------------------------------------------------------

# Initial Page Load

Typical JavaScript Framework

``` text
HTML
 ↓
Large JS bundle
 ↓
Framework boot
 ↓
Hydration
 ↓
Virtual tree
 ↓
Render
```

Fore

``` text
HTML
 ↓
Browser parses page
 ↓
Model initializes
 ↓
Bindings activate
```

There is:

-   No Virtual DOM
-   No hydration
-   No component tree reconstruction

The browser already owns the DOM.

------------------------------------------------------------------------

# Runtime Updates

React

``` text
State changes
 ↓
Component rerender
 ↓
Virtual DOM diff
 ↓
DOM update
```

Fore

``` text
Node changes
 ↓
Affected ModelItems
 ↓
Dependent controls refresh
```

Only affected controls update.

Not entire component trees.

------------------------------------------------------------------------

# Build Complexity

Typical React stack:

``` text
Node
npm
Vite
Webpack
Babel
ESLint
TypeScript
React
ReactDOM
...
```

Fore:

``` text
HTML
ES Modules
Done
```

This simplicity is valuable for long-lived enterprise applications.

------------------------------------------------------------------------

# Expressiveness

  Feature                         | Fore   | Typical JS Framework
  ------------------------------- | ------ | ----------------------
  XPath queries                   | ✔      | Custom JS
  Declarative calculations        | ✔      | Code
  Required                        | ✔      | Code
  Readonly                        | ✔      | Code
  Relevant                        | ✔      | Code
  Constraint                      | ✔      | Code
  Automatic dependency tracking   | ✔      | Partial
  XML native                      | ✔      | Poor
  JSON native                     | ✔      | Yes
  Multiple data instances         | ✔      | Manual

------------------------------------------------------------------------

# Structured Document Editing

One of Fore's strongest differentiators is direct support for structured
document models.

Instead of writing adapters, controls bind directly:

``` xml
<fx-control ref="teiHeader/fileDesc/titleStmt/title"/>
```

This makes Fore especially suitable for:

-   TEI
-   EpiDoc
-   FHIR
-   MODS
-   METS
-   DocBook
-   Complex XML workflows

------------------------------------------------------------------------

# AI Friendliness

## React

An LLM typically encounters:

-   useState()
-   useEffect()
-   useMemo()
-   Reducers
-   Event handlers
-   Custom hooks

Understanding behavior requires reconstructing procedural state flow.

## Fore

The application describes itself:

``` xml
<fx-control ref="name"/>

<fx-bind
    ref="age"
    required="true()"
    constraint=". gt 0"/>

<fx-setvalue
    ref="status"
    value="'approved'"/>
```

The model is explicit.

Dependencies are explicit.

Business rules are explicit.

XPath itself is descriptive:

``` text
customer/address/city
invoice/items/item[price > 100]
ancestor::section
```

This reduces inference work for an AI assistant.

------------------------------------------------------------------------

# Token Efficiency

React applications contain substantial framework boilerplate:

-   State
-   Hooks
-   Effects
-   Memoization
-   JSX
-   Callbacks

Fore primarily contains:

-   Model
-   Bindings
-   Actions
-   Markup

This generally results in fewer tokens for an LLM to process.

------------------------------------------------------------------------

# Explainability

Question:

> Why is this field disabled?

React often requires tracing:

-   Props
-   State
-   Reducers
-   Hooks
-   Effects

Fore usually answers directly:

``` xml
readonly="..."
```

or

``` xml
relevant="..."
```

The governing rule is attached to the model.

------------------------------------------------------------------------

# Maintainability

React often evolves toward:

``` text
Component
 ↓
Hook
 ↓
Reducer
 ↓
Selector
 ↓
Utility
```

Fore tends toward:

``` text
Model
 ↓
Bindings
 ↓
Actions
```

Fewer abstraction layers generally make long-term maintenance easier.

------------------------------------------------------------------------

# Where Fore Excels

-   Structured XML editing
-   Mixed XML/JSON applications
-   Long-lived enterprise forms
-   Healthcare (FHIR)
-   Digital humanities (TEI/EpiDoc)
-   Government forms
-   Declarative business rules
-   Server-rendered applications
-   Low-build environments
-   AI-assisted maintenance

------------------------------------------------------------------------

# Where React, Angular and Vue Excel

-   Massive ecosystems
-   Large developer communities
-   Rich UI component libraries
-   Consumer-facing web applications
-   Animation ecosystems
-   Broad third-party integrations
-   General-purpose application development

Fore deliberately focuses on the structured data and form domain rather
than attempting to be a universal UI framework.

------------------------------------------------------------------------

# Overall Assessment

  Criterion                       |Fore     | React    | Angular    |Vue
  ------------------------------- | ------- |  ------- |  --------- | -------
  Declarative data binding        | ★★★★★   |  ★★☆☆☆   |  ★★★★☆     | ★★★★☆
  Structured data support         | ★★★★★   |  ★★☆☆☆   |  ★★★☆☆     | ★★★☆☆
  XML support                     | ★★★★★   |  ★☆☆☆☆   |  ★☆☆☆☆     | ★☆☆☆☆
  Build simplicity                | ★★★★★   |  ★★☆☆☆   |  ★☆☆☆☆     | ★★★☆☆
  Initial page weight             | ★★★★☆   |  ★★★☆☆   |  ★★☆☆☆     | ★★★★☆
  Automatic dependency tracking   | ★★★★★   |  ★★☆☆☆   |  ★★★☆☆     | ★★★☆☆
  AI readability                  | ★★★★★   |  ★★★☆☆   |  ★★★☆☆     | ★★★☆☆
  Ecosystem                       | ★★☆☆☆   |  ★★★★★   |  ★★★★★     | ★★★★☆
  UI component ecosystem          | ★★☆☆☆   |  ★★★★★   |  ★★★★★     | ★★★★☆
  Enterprise structured forms     | ★★★★★   |  ★★★☆☆   |  ★★★★☆     | ★★★☆☆

------------------------------------------------------------------------

# Conclusion

One increasingly important differentiator is **AI-native architecture**.

Most modern UI frameworks were designed for human developers writing
imperative code. Fore's declarative model, explicit bindings,
XPath-based references, and centralized business rules make an
application much closer to a self-describing knowledge graph.

As AI-assisted software development becomes commonplace, this
architectural property has the potential to become a significant
competitive advantage alongside performance, maintainability and
developer productivity.
