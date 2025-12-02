describe.skip('setattribute demo spec', () => {
  // this is currently skipped due to timeing issues and replaced with setattribute.text.js unit test
  beforeEach(() => {
    cy.visit('actions/setattribute.html');
  });
  // @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
  it('sets an attribute', () => {
    cy.get('fx-fore.fx-ready').should('exist');

    cy.get('fx-trigger').click({ force: true });

    cy.get('div').should('contain.text', "The type is 'myType'");
  });
});
