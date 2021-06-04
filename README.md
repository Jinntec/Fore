
![logo](resources/images/light-200.png)

>'situated in front of something else' - Merriam Webster

## An xformish forms framework in Web Components

Fore is a model-driven forms framework that follows the ideas of the XForms 2.0
Standard but translates those into the world of HTML5 Web Components.

Fore uses XML as it's main data model but is intended to allow JSON alternatively or at the same time.

Through the wonderful [fontoXPath library](https://github.com/FontoXML/fontoxpath) Fore is able to process XML in the client with XPath 3.1 and 
XQuery 3.1 support.

Being as close as possible to the web platform standards available in browsers natively Fore combines well with any other 
JS framework or component library.

## Features

* MVC architecture 
* state engine with dependency tracking
* fully descriptive
* lifecycle with detailed state events
* multiple XML (or JSON) data instances
* group, repeat + switch container components
* generic UI control to bind any kind of component 
* bound template expressions
* powerful XPath/XQuery 3.1 support in the browser

## Framework-agnostic

Fore focuses on providing a stable processing engine for model-driven
forms. Major premise for a longer-term solution is to stick closely to the features
of the browser platform and avoid specific frameworks for the implementation.

That said it's obvious that Fore does not provide a set of controls
by itself but allows you to use whatever uber-fancy components you have
found elsewhere. May it be some material-design date-picker or 
that nice jquery(sic!) timeline nobody has done better yet. 

That comes to the price of slightly more markup up-front (working on it already)
but allows big flexibility and makes it compatible with any framework
that plays by the rules of the platform.

To use whatever component in Fore you wrap it up in the generic
`fx-control` element.

```
<fx-control ref="boundnode">
    <paper-input class="widget" label="my input" name="foo">
</fx-control>
```

The additional attributes `update-event` and `value-prop` allow to 
customize the wiring of the widget you use. 

```
<fx-control ref="checked" update-event="change" value-prop="checked">
    <paper-checkbox class="widget">paper checkbox</paper-checkbox>
</fx-control>
```

More examples are found in the demos (see running)

## Documentation

Currently the demos are the documentation (see 'demo' folder). All files listed on the demo.html page are expected to work.

Some of them also offer some explanations and should give you an idea of building your own.

## Warning

The project is still in it's prerelease phase. However there are already about 100 tests and what can be seen in demos is expected to work. The overall architecture matures quite nicely but certainly can still undergo some fundamental changes. There won't be any major releases before 1.0.0 so be aware of breaking changes (will annouce them). 

It's expected that a first release will be available during this summer.

## Development and Contributions

Contributions are always welcome. Default branch of development is 'dev'. PRs
feature additions or bugfixes will always go into 'dev'.

The master branch is only used for releases. 

## Installation

Run

```npm install @jintec/fore```

in your project to install it.

Import it in your HTML page like so:

```
<script type="module">
    import 'node_modules/@jinntec/fore/dist/fore-all.js';
</script>
```

## Developing

If you intend to hack it yourself ...

> you need to have node installed on your machine (using 15.1.0)

* clone this repo to your machine
* run `npm i` to install dependencies


## Running demos and docs

1. checkout this repo or download the sources
1. change to the rootfolder
1. run `npm i` to install dependencies
1. run `npm run start`

starts the testserver with 'doc/index.html' as entry page. This will send you to 'doc/demos.html' as an
entry point. This lists out running examples to learn and copy from.

## Running test suite

`npm run test:watch`
 
Open your browser and goto to the URL mentioned in console output to start Karma and hit the button in the upper right to run the full test-suite. Will
continously rerun the test suite while you're changing code.

Alternatively you can run the test suite from the commandline once:
```
npm run test
```

## Building a package

```npm run build``` creates two bundles in 'dist' directory.

* fore.js - contains just the Fore classes without dependencies and is suitable for creating your own app-specific bundle
* fore-all.js contains everything in one bundle (incl. dependencies) and is the easiest way to use it in your own project with a single module import. 
The package is still huge but is expected to shrink massively.

Include the repective bundle in your webpage with a module import:
```
<script type="module">
    import 'fore-all.js';
</script>
```
