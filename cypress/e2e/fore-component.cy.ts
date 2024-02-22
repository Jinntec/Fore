describe('fore-component demo', () => {
   beforeEach(() => {
       cy.visit('lab/fore-component.html');
   });
  // @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
  it('should display clock demo as a web component in shadowDOM', () => {
    cy.get('#clock').shadow().find('fx-fore')

      cy.get('.toastify')
          .should('be.visible')

  });

  it('should display todo demo as a web component in shadowDOM', () => {
    cy.get('#todo').shadow().find('fx-fore')

      cy.get('.toastify')
          .should('be.visible')

  });


});
