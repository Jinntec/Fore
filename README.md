
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
* state engine
* dependency tracking
* descriptive actions
* lifecycle with detailed state events
* generic UI control to bind any kind of component 
* multiple XML (or JSON) data instances
* repeats
* template expressions
* powerful XPath/XQuery 3.1 support in the browser


## Warning

This project is still in its early stages.

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


## Running

`npm run start`

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