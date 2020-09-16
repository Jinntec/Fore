# Fore

'situated in front of something else' - Merriam Webster

## An xformish forms framework in Web Components

Fore is a model-driven forms framework that follows the ideas of the XForms
Standard.

## Warning

This project is still in its early stages.

## Development and Contributions

Contributions are always welcome. Default branch of development is 'dev'. PRs
feature additions or bugfixes will always go into 'dev'.

The master branch is only used for releases. 


## Dependencies

* see package.json

must be build with `npm run build` - outputs fontoxpath in 'output' dir. 

ATTENTION: due to my humble knowledge with rollup you still have to change the last line of fontoxpath.js
to `export default fontoxpath;` to make it work.

To check if installation was correct run `npm run test`. Tests should run green.

## Ideas

### make model editable in dev mode

introduce a mode which allows to edit the model itself within 
the page.

- serialization?
- the model as an instance?
