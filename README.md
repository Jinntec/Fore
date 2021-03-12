
![logo](resources/images/light-200.png)

>'situated in front of something else' - Merriam Webster

## An xf ormish forms framework in Web Components

Fore is a model-driven forms framework that follows the ideas of the XForms
Standard.

## Warning

This project is still in its early stages.

## Development and Contributions

Contributions are always welcome. Default branch of development is 'dev'. PRs
feature additions or bugfixes will always go into 'dev'.

The master branch is only used for releases. 

## Installation

> you need to have node installed on your machine (using 15.1.0)

* clone this repo to your machine
* run `npm i` to install dependencies

## Dependencies

* see package.json

must be build with `npm run build` - outputs fontoxpath in 'output' dir. 

ATTENTION: due to my humble knowledge with rollup you still have to change the last line of fontoxpath.js
to `export default fontoxpath;` to make it work.

To check if installation was correct run `npm run test`. Tests should run green.


## Preparing assets


To allow browser-compatible module loading there is a npm script called 'empathy'. This must
be called whenever new node modules are introduced into the project.

`npm run empathy`

This will create a directory 'assets' with all dependencies converted to use local pathes instead
of node_module pathes.

> This approach will eventually change.

## Running

`npm run start`

starts the testserver with 'doc/index.html' as entry page. This will send you to 'doc/demos.html' as an
entry point. This list out running examples to learn and copy from.

## Running test suite

* start Chrome (important as it may hang if you start the watcher first)
* `npm run test:watch'
* goto to the URL mentioned in console output to start Karma and hit the button in the upper right to run the full test-suite
