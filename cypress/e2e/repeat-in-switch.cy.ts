describe('repeat-in-switch demo specc', () => {
   beforeEach(() => {
       cy.visit('repeat-in-switch.html');
   });
  // @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
  it('should display second repeats in switch', () => {
    cy.get('#r-item fx-repeatitem')
		.should('have.length', 3)
    cy.get('#t-page2')
        .click()
    cy.get('#r-item-2 fx-repeatitem')
          .should('have.length', 3)

  });


});
