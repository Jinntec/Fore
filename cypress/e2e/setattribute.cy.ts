describe('setattribute demo spec', () => {
  beforeEach(() => {
    cy.visit('actions/setattribute.html');
  });
  // @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
  it('sets an attribute', () => {
    cy.get('fx-fore.fx-ready').should('exist');

    cy.get('fx-trigger button').click();

    cy.get('div').should('contain.text', "The type is 'myType'");
  });
});
