# Cypress

This project is outfitted with Cypress E2E testing. This is used to cover code where unit tests are difficult to maintain.

## How to run the tests

Locally you can run the tests with two commands:

```sh
# First, install the dependencies
$ npm install

# Run the normal dev server
$ npm run start

# Open cypress. It will open a browser window in which you can choose to run integration tests
$ npx cypress open
```

## How to add tests

You can add tests by adding new TypeScript files to the `cypress/e2e` folder. By convention we use
the same name as the `demo` page. So the tests for `demo/while.html` live in
`cypress/e2e/while.cy.ts`.

Those tests consist of a few parts that are always the same. For example, the test for `while.html`
does the following:

```typescript
describe('while demo spec', () => {
  beforeEach (() => {
    // We are testing while.html, so open that page. Cypress will reload this every test
    cy.visit('while.html');
  });

  it('can count to 10', () => {
    // Make sure we start at an expected state
	cy.get('[data-cy="output"]')
	  .should('contain', '0')
	// Start the counter
	cy.get('[data-cy="counter"]')
	  .click()
	// Assert the toast is shown
	cy.get('.toastify')
	  .should('be.visible')
      .should('contain', 'counted to 10 done')
	// And the counter updated
	cy.get('[data-cy="output"]')
	  .should('contain', '10')
	// Test the rest
	cy.get('[data-cy="reset"]')
     .click()
    cy.get('[data-cy="output"]')
     .should('contain', '0')
   });
});
```

## Targetting elements
Cypress uses DOM selectors to target elements. Use the `data-cy` attribute to target elements.

## ShadowDOM

Fore uses the shadowdom extensively. Cypress can target into shadow roots, but not with normal DOM
selectors. Take the [`i18n`](./cypress/e2e/i18n/i18n.cy.ts) tests for example. Here the `fx-output`
contains a text that we want to assert. We use the `shadow()` method to peer into there.

```typescript
  it('can toggle the language', function() {
    cy.get('[data-cy="EN"]').click();
      cy
		  .get('fx-output')
		  .shadow()
		  .find('#value')
		  .should('contain', 'Description of object');
      cy
		  .get('[data-cy="DE"]')
		  .click();
      cy
		  .get('fx-output')
		  .shadow()
		  .find('#value')
		  .should('contain', 'Objektbeschreibung');
  });
```

## Cypress versus unit tests

Because Cypress takes away all timing issues, they are easier to write than normal unit
tests. Normal unit tests can still be useful for API tests (for instance the workings of the XPath
functions, but integration tests should be done in Cypress.

## CI

The Cypress tests are executed in Github Actions, on every commit.
