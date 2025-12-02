describe('switch events demo spec', () => {
    beforeEach(() => {
        cy.visit('switch-selected.html');
    });
    // @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
    it('dispatches select/deselect events after toggle', () => {
        cy.get('fx-fore.fx-ready').click()

        cy.get('fx-output[ref="page1"]')
          .should('have.value', 'selected')
        cy.get('fx-output[ref="page2"]')
          .should('have.value', '')

        cy.get('button')
            .click()

        cy.get('fx-output[ref="page1"]')
          .should('have.value', 'deselected')
        cy.get('fx-output[ref="page2"]')
            .should('have.value', 'selected')

    });


});
