describe('todo2 demo spec', () => {
    beforeEach(() => {
        cy.visit('todo2.html');
    });
    // @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
    it('should have h1', () => {
        cy.get('h1')
            .should('contain.text', 'Todo')

        cy.get('#clearbtn').click()

        cy.get('.btn.add').click()

        cy.get('#task').type('foo')

        cy.get('.btn.add').click()

        cy.get('#task').type('bar')

        // cy.get('#completeCtrl').click()
        // cy.get('fx-repeatitem').should('be.hidden');

    });

});
