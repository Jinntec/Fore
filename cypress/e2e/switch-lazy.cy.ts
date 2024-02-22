describe('lazy-switch demo specc', () => {
    beforeEach(() => {
        cy.visit('switch-lazy.html');
    });
    // @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
    it('should display second case', () => {
        cy.get('fx-case:nth-child(1) fx-control')
            .should('be.visible')
            .should('have.value', 'a bound item')

        cy.get('fx-case:nth-child(2) fx-control')
            .should('have.value', '')

        cy.get('fx-case:nth-child(3) fx-control')
            .should('have.value', '')

        cy.get('#page2btn').click()
        cy.get('fx-case:nth-child(2) fx-control')
            .should('be.visible')
            .should('have.value', 'second bound item')

        cy.get('#page3btn').click()
        cy.get('fx-case:nth-child(3) fx-control')
            .should('be.visible')
            .should('have.value', 'third bound item')

        cy.get('#page1btn').click()
        cy.get('fx-case:nth-child(1) fx-control')
            .should('be.visible')
            .should('have.value', 'a bound item')



    });


});
