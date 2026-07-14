# Changelog

All notable changes to this project are documented here, one section per published release.
Entries are sourced from the project's GitHub release notes. For full commit-level diffs between any two versions, see https://github.com/Jinntec/Fore/releases or compare tags directly, e.g. `https://github.com/Jinntec/Fore/compare/vX.Y.Z...vA.B.C`.

## [4.0.0] - 2026-07-14

### breaking

* XForms 2.0 spec-compliant variable evaluation points - stabilized and covered with new tests

### new

* configurable undo/redo capability with keyboard shortcuts
* new `fx-minimap` for navigation
* progressive and virtualized `fx-repeat` rendering for large row counts
* new ACCESSIBILITY.md documenting WCAG 2.1 AA conformance, plus fixes on reported elements
* new issue and PR templates
* recursive node creation for `create-nodes` mode (#361, thanks @DrRataplan)

### performance

* major performance improvements to ModelItem handling - indexed lookups replace linear scans in registration/deregistration and rebuild retargeting
* shared stylesheet caching across repeated controls
* fixed a critical bug in path generation and tuned it to run 3x faster with 73x fewer XPath calls

### fixes

* #246 #359 #353 #349 and further bugs
* many additional test cases added

### chores

* upgraded cypress
* dependency cleanup

## [3.3.2] - 2026-07-02

### new

* html validation works alongside Fore validation
* additional demos

## [3.3.1] - 2026-07-02

_No release notes recorded for this version._

## [3.3.0] - 2026-07-01

### additions

* support for native HTML form validation synced into the lifecycle of Fore supporting :user-invalid (showing errors after interaction)
* lazy-loaded select lists with `data-src` attribute save you from creating an explicit fx-instance for each pick-list
* refine fx-lens layout, added ability to show and copy absolute path
* new build based on 'Vite' reduces package size by 20%
* new tests

### fixes

* missing await fixed in fx-control and fx-item
* dispatch events consistently
* properly await batched notifications

## [3.2.1] - 2026-06-12

* hardened and fixed behavior of fx-include in create-nodes mode.
* always include outer element when no selector is given for fx-include
* additional tests

## [3.2.0] - 2026-06-09

### fixes

* fixes a bug with missing 'select' events on dynamically loaded fx-case elements
* fixes a potential null access in getModelItem() calls

### features

* new fx-include element to dynamically load snippets of markup. Supports immediate or on event loading, external sources and inline templates. 

### demos

* new wizard demo using fx-switch

## [3.1.2] - 2026-05-27

### fixes

* fixes an issue with group relevance in create-nodes mode - adds unit-tests

## [3.1.1] - 2026-05-20

### fixes

* fixes a bug in create-nodes with pathes like a[@href='http://....']

## [3.1.0] - 2026-05-20

### additions

* new authoring checks routine that signals broken idrefs in the markup - e.g. instances, repeats, submissions that are referenced but do not exist.
 
### fixes

* fixes a severe issue with unnecessary recursing in refresh which slowed the processor significantly

## [3.0.1] - 2026-03-16

deploy failure on npmjs.com forced this patch release

## [3.0.0] - 2026-03-13

### 3.0.0

### Enhancements

* JSON is now a first-class data format and can be updated also 
* There is a pre-defined variable for each fx-instance now that shortens the writing of absolute binding expressions
* new demos

### Fixes

* evaluateTemplateExpression uses correct context element
* fixed context for computes
* fixed call to markAsClean also resetting 'visited' classes

## [2.9.0] - 2026-01-21

### extensions

* <fx-functionlib> now can import ES6 module JavaScript files and register all exported named functions. Externalizes the JS and allows to use a debugger inside the functions. New demo, test and documentation.

## [2.8.0] - 2025-12-19

### new features + improvements

* with `init-on' and 'init-on-target' attributes on `fx-fore` a certain event can be awaited before Fore even starts initializing. With demos
* HTML support has been improved in instance and submission
* it is possible now to specify the response mediatype 
* completely new dependency-free fx-lens data inspection tool
* reduced package size 
* addditional tests
* restructured demo page a bit

### fixes

* a bug with not firing `valid` event was fixed
* a bug with not firing 'relevant' event was fixed
* `aria-invalid` attribute state has been fixed not switching to false
* circular dependency in build was fixed

## [2.7.2] - 2025-12-09

### Fixes

* accept repeat over strings when create-nodes is active
* fx-control now properly handles `as='xml'` to bind to unparsed xml
* modified state was fixed in fx-fore to start listening not before user interaction

### Demos

* new featured demo with JinnTap
* several refinements

## [2.7.1] - 2025-12-04

fixes a bug in fx-load action now using resolvedUrl for _blank and _self targets

## [2.7.0] - 2025-12-02

This release features a large refactoring of the refresh() algorithm now being fully based on Observers (including repeats) improving performance esp. with big pages. This includes a complete rework of `fx-repeat` and `fx-repeat-attributes`.

The second big feature is the improved create-nodes mode that now can deal with complex pathes and create attributes on the way.

### Features
* create-nodes mode now supports nested pathes and creation of attributes
* added `wait-for` attribute that takes id references to another `fx-fore` element and awaits its `ready` event before initializing itself
* supporting `aria-invalid` now

### Fixes
* several bugs in fx-lens
* detail fixes in `fx-refresh`, `fx-setfocus`
* fixes in index handling

## [2.6.0] - 2025-06-10

### Additional features
* on-demand controls that can be switched with the help of new <fx-control-menu> component
* mode 'hide-on-empty' with on-demand controls to initially hide empty controls
* introduced UIElement class
* new <fx-lens> tool to display instances
* supporting templated 'title' attribute for <option> elements
* refined create-nodes mode to store created nodeset for use with fx-insert
* improvements to <fx-lens> listening for more events
* passing http status codes with submit-error and submit-done events
* improved linting
* support for svg with replace=target
* new demos


### Fixes
* <fx-setvalue> uses inscopeContext now
* <fx-fore> has an aria-role="form" now
* prevents option label evaluation to fail when containing line breaks
* if force also rescan template expressions
* fixed some problems with packaging
* do not update inert elements
* improved text support for instances

## [2.5.0] - 2024-12-12

### new features
* new `fx-lens` component to inspect all data instances within a page and remembering state like size, open panels across page reloads
* new `fx-upload` to upload text or binary data and embed into XML document
* new `create-nodes` attribute on `<fx-fore>` allows to create missing XML nodes from UI binding expressions

### improvements
* not refreshing inert elements
* submission replace="target" now supports svg  and inlines it at desired node
* improved handling of text instances
* 'lib/lib-util.html' - function lib with get-localstore-value and set-localstore-value functions
* `delete`, `insert` and `value-changed` events now pass instanceId and foreId (if set) 
* explicit handling of text in setvalue
* clarified declaration and resolution of XML namespaces
* new utility function `XPathUtil.querySelectorAll` that seaches the content of `<template>` elements in addtion to standard function
* 

### fixes
* `oldValue` fixed for `value-changed` event
* variables are now correctly scoped to their ancestor `<fx-fore>` element

## [2.4.2] - 2024-10-19

* Fixes handling of text/plain responses and targetref
* now properly support optional responsemediatype on submissions (defaults to mediatype of request)

## [2.4.1] - 2024-10-08

Fixes a regression with refresh introduced by optimization.

## [2.4.0] - 2024-10-07

This release brings some massive speed improvements by minimizing refreshes caused by repeat index updates.

Besides fx-switch has been fixed to avoid using '!important' styling rule allowing to overwrite the behavior.

## [2.3.2] - 2024-09-25

fixes a hardcoded '!important' rule

## [2.3.1] - 2024-09-19

* Fixes issues with 2.3.0 broken package-lock.json
* adds some missing resources

## [2.3.0] - 2024-09-18

### new

* fx-case extended to load content from external file
* new fx-unmodified action to reset 'modified' state of a Fore element after e.g. a save operation
* improved code linting, formatting, typedocs
* using inert for model and action elements
* diverse demo changes/refinements
* improved functionlib rendering

### fixes
* fixes page exit confirmation to not occur always but only when data have changed
* handling of data-list in nested situations
* fixing function registration issue
* fix for select multiple

## [2.2.0] - 2024-05-29

### Fixes

* fixes fx-var elements loosing context sometimes
* fixes fx-var elements returning multiple elements
* fixes fx-var to use inscopevariables
* prevent value-changed events not coming from fx-control

### Features
* new fx-functionlib element allowing to externalize custom functions and reuse them across pages

Otherwise several demos have been revised and refined.

## [2.1.1] - 2024-05-07

### fixes

* fixed an issue with tabindex being ignored on fx-trigger
* fixed an issue with fx-var elements loosing their value esp. when pointing to attribute nodes

## [2.1.0] - 2024-05-02

### new features

* Drag and Drop support 
* added the `iterate` attribute to actions

## [2.0.0] - 2024-02-22

### Breaking changes

* the `url` attribute has been renamed to `src` for better alignment with HTML standard (-> as in `img`, `iframe`, `scipt`)

To upgrade to this version you need to change all occurrences of
```
<fx-control url="...">
```
to
```
<fx-control src="...">
```

### Fixes

* fix for shared instances to take shadow boundaries into account
* fixes a regression in fx-toggle action missing the refresh
* inconsistent event dispatching has be addressed
* fixes sometimes missing evaluations of template expressions in repeat and switch

### Improvements

* adapt logging to nested situations and output target id respectively
* more e2e tests

## [1.10.3] - 2024-02-01

### Fixes

* fixes an issue with resolving the instance within nested <fx-bind> elements

## [1.10.2] - 2024-01-27

### Fixes

* problems with shared instances fixed. More elegant and simple approach to instance sharing implemented.
* fx-switch reworked for consistently dispatching 'select', 'deselect' events avoiding double dispatching and potential refresh loops

New cypress tests for shared-instances demo.

## [1.10.1] - 2024-01-26

### Fixes

* rollback some unstable changes in 1.10.0 regarding refresh algorithm
* relevance not handled via boolean attributes instead of hard-coded style 'display'
* fixed missing rebuild in fx-insert leading to missing updates

### Improvements

* improved error-handling catching more authoring problems

## [1.10.0] - 2023-12-20

### new features
* repeat update algorithm refined: now updating only bindings within a repeat that are affected by a change even if the expression does not relate to repeated item directly: This also eliminates potential missing refreshes occurring in more complex cases.
* fx-instance can now share its data with nested Fore elements. This makes it significantly easier to break down a page into several logical sections without the need to pass data back upwards.
* restructured demo page
* new demo files
* added more E2E CyPress tests
* added some default aria-roles for groups, dialogs, 
* added new functions
  * uri()
  * uri-query()
  * uri-param(paramName)
  * uri-path()
  * uri-fragment()
  * uri-scheme()
  * uri-scheme-specific-part()
  * uri-host()
  * uri-port()
  * local-date()
  * local-dateTime()

### Fixes
* fixing potential issues with instance pathes now being included into canonical path
* #240 
* fixed a bug in fx-setfocus causing failure in repeated item

## [1.9.0] - 2023-11-01

### fixes

* fixes wrong version tagging in npm packages
* enable WARN message
* fixing a race condition on nested Fore elements bound as controls
* fixed release process to build proper npm packages
* prevent control from updating when not relevant

### new features

* global 'ignore-expressions' attrbute allowing to exclude certain elements from Template Expression evaluation
* added cypress tests
* added 'credentials' attribute to fx-instance, fx-submission and fx-control to allow fine-grained handling of credentials

## [1.8.0] - 2023-10-12

### Fixes

* removed postinstall task from package.json causing problems with npm installation
* replaced by 'install-demos' task

### Features

* fx-instance now explicitly supports type="text"
* fx-submission can send response to new browser tab 

### Submission writing to new browser tab
```
<fx-submission url="...something..."  replace="all" target="_blank">
```

### fx-call action

* new `<fx-call>` action to call a block of actions or a function

```
<fx-action id="action-block">
    ...
</fx-action>
<fx-call action="action-block"></fx-call>
```

```
<fx-function signature="hello()" type="text/javascript">
    alert('hi');
</fx-function>
<fx-call function="hello()"></fx-call>
```

## [1.7.2] - 2023-09-29

* fixes a bug in fx-load action wrongly overwriting the url attribute instead of just evaluating it
* adds ability to query Fore version at runtime via

```
document.querySelector('fx-fore').version
```

## [1.7.1] - 2023-09-20

Fixes:

* context() function in repeats #221 
* stop template expression evaluation at nested fx-fore elements.

## [1.7.0] - 2023-09-01

### new features

* fx-toggleboolean action for easier switching of Boolean values
* updated fontoxpath to latest
* enhanced cross-linked versions of the demos 

### fixes

* fixed bug in dependency graph not picking up constraint facets

## [1.6.0] - 2023-07-22

### added features

### fx-load action

Inserts content either from local template or by calling url.

If URL returns a page containing a 'fx-fore' element it will be extracted and inserted at `attach-to`.


### Loading from a URL
```
<fx-load event="ready" url="load-snippet.html" attach-to="#thetarget"></fx-load>
...
<div id="thetarget"></div>
```

### Using a template
```
<fx-load attach-to="#lazyControl" id="first">
    <template>
        <fx-control ref="item">
            <label>an item:</label>
        </fx-control>
        <fx-output ref="item"></fx-output>
    </template>
   <div id="first"></div>
</fx-load>
```

### Awaiting a custom event from templated content
```
<fx-load id="load1" attach-to="#transcript" await="pb-update">
    <template>
        <pb-view id="view1" src="document1" view="page" append-footnotes animation
                 subscribe="transcription" emit="transcription"></pb-view>
    </template>
</fx-load>
```

### Fore Glass

Fore Glass is the new inspector tool to help you understand what's going on behind the scenes.

It provides:
* a log of actions and events
* a DOM inspector 
* a Data inspector showing all loaded fx-instances

![Screenshot 2023-06-30 at 16 06 10](https://github.com/Jinntec/Fore/assets/484059/4713ed99-5727-48ad-8561-09c6938aa4c7)

### fore-component

With `fore-component` Web Components can now be implemented with Fore. 

Provides a generic Web Component that loads a ForeBody from `src` and puts it into shadowDOM.  

It accepts a local `link` element to inject CSS into the shadowRoot with CSS constructed stylesheets.

It might also be used as a blueprint to write your own custom Web Components that use Fore for their implementation.

```
<fore-component id="clock" src="clock2.html" class="first">
    <link rel="stylesheet" href="../../resources/fore.css"/>
    <link rel="stylesheet" href="./clock.css"/>
</fore-component>
```

### Action enhancements

* 'phase' attribute for actions allows to attach listeners to 'capture' or 'default' phase
* 'defaultAction' with values 'perform' or 'cancel' allowing the cancel the default action

### Enhancements to send

fx-send action now can overwrite 'url' and 'target' attributes of the submission it is calling allowing to tighten the markup in some situations.

```
<fx-submission id="sub" url="someUrl" ...>
...
<fx-send submission="sub" url="anotherUrl">
```

### fx-control can now create attributes

If an attribute does not exist in the data this usually makes a control nonrelevant. This can force complicated data manipulations to make it work. 

By adding a `create` attribute to `fx-control` is can now be overcome. The `create` attribute is scoped - meaning it will be search the DOM tree upwards so this behavior can easily applied to a group of controls or even the whole UI.


### new demo files

There are some new demos and others have been improved.



### fixes and improvements
* improvements to fx-setfocus
* improved id resolution
* rebuilding after fx-replace
* handling of event detail
* improved variable scoping
* improved scoping of nested Fore elements
* various improvements to fx-control
* many detail fixes in Demos and Documentation
* improvements for fx-items
* fix against focus stealing

## [1.5.0] - 2023-01-05

### new Features
* repeats can now be created via `data-ref` attributes to support output of tables and lists. Demo page 'demo/repeat-attributes.html' illustrates the usage.
* event propagation can now be stopped with `propagate="stop"` on any action element.

## [1.4.0] - 2022-12-22

This release mostly features performance improvements by introducing an outermost action handler that awaits all nested actions before executing an update cycle.

Especially big, complex pages with a lot of initialization tasks profit and will load in a fraction of the time.

The refactoring also increases overall stability of the engine by properly awaiting actions.

### added functionality

* `fx-case` elements will now dispatch 'select' and 'deselect' events to hook into when a case is shown/hidden
* `instance()` function has been improved for performance

### fixes

* another fix to inscopeContext to always return default instance
* alerts defined on `fx-bind` are working again properly. Implementation was improved.

## [1.3.0] - 2022-12-05

### additions

* refined validation behavior in submission mode and interactively by introducing a `visited` class that gets set once the user has 'touched' the control. Added `submit-validation-failed` class to allow easier custom styling
* fx-trigger supports a `debounce` attribute that take a millisecond value deferring the execution of the trigger. This is convenient to prevent double submissions when the user clicks fast or double-clicks a button.
* when a control is required but empty it will have a `isEmpty` CSS class now.
* Fore supports a `show-confirmation` attribute now that takes a boolean XPath expression to either show or suppress a page exit confirmation dialog.
* added a `fx-reload` action to do a hard page reload
* added additional demos 
* dispatching `dialog-shown` and `dialog-hidden` events 
* `fx-output` support mediatype image now
* improved console logging for the dev version for better readability
* now supporting static lists that get loaded and updated only once. 
* a required but empty control will also get `invalid` attribute set
* improved support for `localStore` now with `get`, `post`, `delete` methods
* `fx-focus` can optionally select the content of a control by specifying the empty `select` attribute
* `fx-message` now properly deals with template expressions in its body

### fixes

* delete when there's no nodeset
* submission `into`
* setting of focus in repeated sections
* fixed a bug with inscope variables 
* submission content-type now depending on `serialization` attribute
* proper handling of `valid`, `invalid` empty attributes
* fixed `fx-confirm` action
* `fx-inspector` when dealing with empty results
* fixing bug with relevance processing of `fx-group`
* issues with whitespace (newlines) in template expressions
* inscopeContext leaving the parent `fx-fore` element

### optimizations

* initial scanning for template expressions now runs at least 3 times faster
* `fx-switch` only refreshes selected case
* optimized and cached instance finding in XPath engine

## [1.2.0] - 2022-08-26

### Features:
* added 'control' attribute to `<fx-refresh>` to address a control for refresh. Can be handy with custom components used as widget

### Fixes
* fixed empty nodeset detection in abstract-control
* fixed getVariablesInScope
* submission now forces refresh after a replace="instance"
* fixed refresh to respect force mode
* fixed missing registration as bound control in control.setValue
* fixed container trying to add to boundControls when actually not being bound
* fixed additon of inscopeVariables in abstract-action
* fixed initialization of inscopeVariables

## [1.1.0] - 2022-08-18

### Fore 1.1.0

### new or improved functionality

* support for keyboard events
* recalculation is skipped is there's no model present
* revalidation is skipped if there are no modelitems
* a couple of minor fixes improving stability
* <fx-refresh> now supports a 'force' marker attribute to do just that
* fixing updating of control value with 'as="node"'
* fixed an issue with selection of cases
* fixed usage of functions in predicates
* performance improvement in template expression evaluation
* submissions can now read and write to localstorage of the browser
* supporting `selection="open"` for `<select>` controls resulting in an additional empty option to allow empty values
* fixing bug with submission not preserving the root element of the data. 
* fixing `context()` function not returning the nodeset of the parent but the parent
* new `<fx-focus>` action
* added warning when dialog is not present
* fixed comparison of oldVal vers. newVal for nodes
* revalidate will also validate for requiredness now
* silently ignore unparseable XPath expressions in template expressions
* fixed error with initial template expression parsing that created issues with data containing '{}'
* added capability to use XQuery Update Facility in custom functions


### demo enhancements

* an accordion with fx-switch
* bibliography now shows how to use multiple namespaces
* XQuery Update function in action in enhanced demo
* demo for key events
* demo using new 'localstore' submissions
* demo showing use of required values and submission

## [1.0.0] - 2022-06-16

### Fore 1.0.0

This is the first major release of Fore with following improvements:

### Documentation

* there is a new [homepage](https://jinntec.github.io/Fore/doc/index.html) for Fore when starting up via `npm start` in  a local install or online on github pages
* likewise the [demo overview page](https://jinntec.github.io/Fore/doc/demo.html) has been rebuild from scratch for better overview
* there's a brand-new [Fore documentation site](https://jinntec.github.io/fore-docs/) with tutorial and element reference

### Functionality

* instances now throw an error when `src` cannot be resolved
* json instances are now handled by submission
* reworked `<fx-inspector>` for viewing live xml and json data in a collapsible sidebar
* upgraded to latest fontoXPath
* support for nested `<fx-fore>` elements loaded from external file. These can be used within a `<fx-control>` to bind the data of a sub-Fore and mount them to a target node. Event blubbing will stay within the scope of the host `<fx-fore>` element and ids will likewise be resolved only within that scope.
* factored out relevance processing
* new `<fx-replace>` action to replace one node with another
* with the new `as` attribute `<fx-control>` is now capable of passing its bound node to a widget instead of just the text value
* new 'debounce' feature for `<fx-control>` to reduce event firing
* refactored event firing and extracted to static function
* custom function can now be used without 'local' prefix
* all fore elements are now guarded against 'customElements.define' error

### Bugfixes
* fixed inscopeContext for AbstractAction
* fixed `<fx-toggle>` extending wrong class
* fixed repeat updating
* fixed relevance processing for repeats becoming unbound
* fix to `<fx-control>` to silently return when unbound
* fixed a bug in inscopeContext when using 'context' attribute
* not choking on empty variables when registering function
* fixing a bug with repeatitems not being registered with modelitem leading to missing refreshes
* preventing control from setting a value when in 'readonly' state
* fixed deferred behavior of '<fx-action>`
* fixed a cyclic dependency
* fixed an issue with lazy model creation
* lots of enhancements and fixes to demo files

New tests added.
New demos have been added.

### Credits

Special thanks go to Martin Middel for his always competent and quick help on fontoXPath related questions and as a discussion partner
on the harder parts of the architecture. Fore wouldn't be here now without him.

Further to mentioned:

* Alfredo Cosco 
* Alexandra v. Criegern
* cwittern
* Wolfgang Meier
* Juri Leino
* Magdalena Turska
* Lars Windauer

for their suggestions and patches.

Last but not least all people that left a star for the project.

## [1.0.0-5] - 2022-03-16

### new Features

* updated version of jinn-toast element with sticky option that can be styled via a '.sticky-message' CSS class
* improved example for `fx-var` element
* a couple of new tests

### Fixes

* fixed some issues with `context` and `ref` attribute combinations in getInscopeContext
* fixed insert behavior with above attributes
* fixed `getInstanceId` function
* fixed toggle implementation
* fixed container refresh behavior (failing to register for refresh)
* fixed a bug when there are no vars
* fixed #93 
* fixed #114 
* Very important fix for #111 now throwing error when cyclic graphs occur in certain situations when the '//' operator is used.
* fixed a bug in DependencyNotifyingDomFacade that returned too many children

## [1.0.0-4] - 2022-03-01

This is a patch release for 1.0.0-3 where the bundling of new features still failed. Sorry for confusion.

## [1.0.0-3] - 2022-02-28

### Highlights of this release

* This release brings major performance improvements for all update operations updating the UI about 200-300 times faster than before by selectively updating only affected controls.
* The new `fx-var` element with can dramatically ease the authoring of complex statements
* New `fx-dialog` along with `xf-show` and `fx-hide` actions
* `fx-fore` supports a `src` attribute to load a `fx-fore` element from some other html file
* fixes to the `context()` function
* es-dev-server config now supports CORS to enable development with 2 servers where the dev-server is used to serve the Fore sources. 
* fixed a bug with additionally including text nodes for each referred path into the mainGraph

## [1.0.0-2] - 2022-02-04

### Performance Updates

* fixed some issues with mainGraph construction
* tracking changed modelItems
* subgraphing for recalculation so that only nodes are re-computed that are dependant of changed nodes

### Fixes

* Submission response dispatches `submit-error` for response status > 400Gr
* updated to latest dep_graph.js
* `targetref` wrongly used instance object instead of firstChildElement
* template finding in controls
* regression in evaluation of control nodeset
* missing constraint property on ModelItem
* inscopeContext evaluation returning first entry from an array now
* accessing defaultContext is prevented during model.init

### Additions

* new Fore Element reference describing attributes, event and link to demo usages
* Actions may attach listeners on window
* `xpath-default-namespace` can be set individually on each `fx-instance` to allow mixing of namespaces
* id references in repeats are resolved now so that individual elements can be referenced within a repeat template
* still experimental lazy refresh behind a flag attribute `refresh-on-view` that will refresh only reference that are currently in the viewport
* changed `fx-alert` to plain vanilla component
* new `fx-inspector` to log all live instance data to a section at the bottom of the viewport 
* basic `context()` function - still needs further testcases
* prettyfied XML output with `log()` function
* allowing to insert a response node into a target node with submission
* `fx-instance` may have type `html` now - for outputting somewhere in the page with `fx-output`
* subgraph demo with visualization of dependency graph
* refactor: renamed formElement to foreElement 
* preventing updateModel when no binds are present avoiding construction of dependency graph and update cycle altogether

## [1.0.0-1] - 2021-10-28

Second pre-release coming with various detail fixes and improvements.

Notable improvements:
* fx-output supports HTML now
* id resolution in repeats implemented as proposed by XForms 2.0
* a bug has been fixed that prevented 'item()' being used as param of custom function. Regex pattern has been fixed.
* fixes issues with switching non-relevant/relevant repeat items
* some demos added

## [1.0.0-0] - 2021-10-17

This is the first pre-release of Fore and may still contain some detail issues.  

* all console statements now stripped from fore-all.js. You can still build a packaged version with console message via `npm run build`
* implemented relevance selection during submission including support for `non-relevant` attribute
* added XML namespace support
* added `#echo` submission handler allowing relevance filtered responses and tests.
* added an additional package 'fore-debug.js' which contains console.log messages for debugging purposes
* added a dispatch function to ForeElementMixin
* fixed refresh behavior to not evaluate validity during initial refresh
* new demo files and many improvements to the existing ones
* support for `serialization="none"` 
* lazy creation of instanceData if not present
* new fx-header element to set request headers
* improved content-type handling for `fx-instance`and `fx-submission`
* implemented `urlencoded-post` in `fx-submission`
* implemented partial submit and replacement through `ref` and `targetref`attributes
* support for disabled triggers
* fixed focus in repeat when tabbing through fields

## [0.25.1] - 2021-09-15

* fixing a bug in fx-setvalue
* additional and improved demos for 'while' and 'delay'
* improved implementation of 'while' and 'delay' using promises
* removed cyclic dependency
* fixed a bug in fx-trigger to ensure actions are run in sequence

## [0.25.0] - 2021-09-03

* added fx-insert action and implemented a set of use cases 
* added fx-update and fx-refresh actions
* implemented 'while' attribute for actions for loops
* simple implementation of 'delay' (not working alongside 'while' yet)
* repeat with atomic values including demo
* implemented 'context' attribute

## [0.24.0] - 2021-07-16

Breaking change: `<fx-form>` is now `<fx-fore>`
For reasons see discussions here on github.

* renamed fx-form to fx-fore and changed all of its usages
* simplified and fixed css importing
* fixed a bug with fx-switch and added tests
* fixed a regression with fx-append that broke nested repeats
* demos should be functional again

## [0.23.0] - 2021-07-10

big steps towards 1.0.0:
* removed all third-party dependencies except (of course) fontoXPath
* replace vaadin-notification with our own component with single dependency
* demo now have their own package.json to allow use of third-party components without bloating Fore build
* json instance loading via 'src' also working
* replace iron-ajax with native fetch API
* linting

## [0.22.0] - 2021-07-02

* breaking change to fx-setvalue: static values are only allowed as content now leaving the 'value' attribute for dynamic values
* greatly improved event handling with new options 
* implemented event() function to access event detail object from within XPath
* fx-setvalue also accepts document or element nodes as value
* new demos for event-related features
* new tests

## [0.21.0] - 2021-06-30

* fixing missing dist files 
* removed paper-dialog and other dependencies

## [0.20.1] - 2021-06-29

changed fx-dispatch again to use 'name' instead of 'event' attribute to avoid confusion with other actions and to enable dispatch to also listen for events.

## [0.20.0] - 2021-06-25

* JSON binding support (JSON manipulation still in the works)
* bound fx-switch element
* action using JavaScript
* new fx-dispatch action with support for static and dynamic parameters
* many new or improved demos

## [0.19.0] - 2021-06-03

* auto-detection of dependent nodes in XPath expressions (no requirement for depends() function any more)
* removed usages of depends() function in demos
* fixed dependency graph to calculate always the same re-evaluation sequence no matter of order of occurrence of the expressions
* a lot of new or refined demos
* fx-repeat within fx-switch
* further substancial refactoring of XPath evaluation
* improved custom function support passing in the fx-form element as context which gives access to the whole API to interact with.
* fixing an refresh issue picking up elements from model
* rewritten fx-submission to use fetch API instead of iron-ajax (fx-instance still to do)
* fixed instanc() function to accept zero attributes -> similar to instance('default')
* more consistent use of inscopeContext
* fixed a regression with selects with templates
* implemented template expressions for fx-submission/@url attribute for dynamic GET requests
* added new modes for fx-submission/@replace: 
  * 'all' - will replace the whole viewport with the response data
  * 'target' - expects HTML response and replaces the element addressed by an CSS selector with the response data
  * 'redirect' - expects URL as text and redirects to that URL
* submission network errors trigger 'submit-error' event 
* a bunch of new tests

As always: the demos are the reference. If you encounter samples not working as expected please file an issue.

## [0.18.0] - 2021-05-13

* custom functions in JavaScript or XPath
* submission chaining
* submission event hooks
* linting green for first time
* new tests

## [0.17.0] - 2021-05-07

* conditional actions
* fx-action element implementation firing a sequence of actions without update cycle
* centralized and refactored XPath processing
* remove LitElement dependency - returning to all plain-vanilla components
* index processing now cleanly works for nested repeat
* a bunch of new tests
* groundworks for custom local functions in JavaScript and XPath/XQuery (coming with next release)

## [0.16.0] - 2021-04-28

* refactoring of fx-control
* renamed fx-abstract-control to abstract-control
* dropped fx-input and fx-button 
* new fx-trigger that wraps buttons, links and images similar to fx-control
* many many improvements to demos
* new log() function to display instance data for debugging

## [0.15.0] - 2021-04-17

* updated readme
* support for basic switch/case with toggle action 
* new switch demo
* centralizing XPath evaluation in new xpath-evaluation class
* set linting and prettier into place and corrected about 300 issues (6 left)
* ported over all depGraph tests
* added more tests for model and controls

## [0.14.1] - 2021-03-31

npm package now containing dist versions

## [0.14.0] - 2021-03-31

* nested repeat with append and delete actions (demo)
* index handling scoped to respective repeat
* repeat is plain-vanilla component now (removed litelement dep)
* fix with scoped resolution for repeatitems
* instructions for building added to readme

## [0.13.0] - 2021-03-27

* new function resolver to allow custom forms functions in default xpath namespace
* new rollup creating 2 versions - just the core with dependencies and a full package containing everything in one bundle
* removed unused dependencies
* index-handling for delete action implemented
* more robust implementation of getModel() function in ForeElementMixin
* new repeat tests

