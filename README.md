# Fore


## Dependencies

* fontoxpath

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
