# Contributing

Contributions are welcome. 

## What to contribute

### Demos + Docs

"demo or die" - Fore is open with regard to the functionality. It's expected to grow over time and
new ideas getting added on the way that haven't been planned ahead of time.

Demos illustrate what's working and also explain the different options of a feature. New demos
should follow the the structure and styling of the existing files in the 'demo' directory.

Demos can also be accompanied by end-to-end tests. these are an easy way to make sure the demo keeps
running. Refer to [the cypress docs](./CYPRESS.md) to see how you can add those tests.

### Code

Code contributions are accepted as pull requests to the default branch (dev). 

Before sending a PR you should:
* add tests as appropriate for new features and make sure they run green
* run the tests with `npm run test`
* run the linter with `npm run lint:eslint`
* there's no harm to also run 'npm run format:prettier` 

### Tests

Testers highly welcome. There's myriad of possibilities to break the code. Help to fix the loose
ends. Automated tests are even better! Read the [Cypress documentation](./CYPRESS.md) to see how you
can add new tests!

### Bug reports

Add the following to a bug report:

* describe your use case shortly
* what do you expect?
* what do you get?

Don't forget to add information about your browser version and OS.

### Spread the word

If you're using Fore please let us and the world know. 
