describe('function-lib2.html (Fore-ready based)', () => {
    it('renders function outputs deterministically', () => {
        cy.visit('function-lib/function-lib2.html');

        cy.get('fx-fore[data-cy="first"]')
            .should('have.class', 'fx-ready')
            .within(() => {
                cy.get('[data-cy="theanswer"]').should('contain.text', '42');
                cy.get('[data-cy="hello"]').should('contain.text', 'Hello from function');
                cy.get('[data-cy="helloXPath"]').should('contain.text', 'Hello - from XPath function');
            });

        cy.get('fx-fore[data-cy="second"]')
            .should('have.class', 'fx-ready')
            .within(() => {
                cy.get('[data-cy="theanswer"]').should('contain.text', '42');
                cy.get('[data-cy="hello"]').should('contain.text', 'Hello from function');
            });

        cy.get('fx-fore[data-cy="third"]')
            .should('have.class', 'fx-ready')
            .within(() => {
                cy.contains('p', 'And the answer is 42');
                cy.get('[data-cy="hello"]').should('contain.text', 'Hello from XPath function');
                cy.get('[data-cy="helloXPath"]').should('contain.text', 'Hello - from XPath function');
            });
    });
});