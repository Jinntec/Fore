describe('function-lib2.html (Fore-ready based)', () => {
    it('renders function outputs deterministically', () => {
        cy.visit('function-lib/function-lib2.html');

        // Wait until all Fore instances on the page are ready
        cy.get('fx-fore').should('have.length.at.least', 1);
        cy.get('fx-fore.fx-ready', { timeout: 10000 }).should('have.length.at.least', 1);

        // Assert prefixless fore (first one)
        cy.get('fx-fore.fx-ready').eq(0).within(() => {
            cy.get('[data-cy="theanswer"]').should('contain.text', '42');
            cy.get('[data-cy="hello"]').should('contain.text', 'Hello');
        });

        // Assert prefixed fore (second one), if present
        cy.get('fx-fore.fx-ready').then($fores => {
            if ($fores.length >= 2) {
                cy.wrap($fores.eq(1)).within(() => {
                    cy.get('[data-cy="theanswer"]').should('contain.text', '42');
                    cy.get('[data-cy="hello"]').should('contain.text', 'Hello');
                });
            }
        });
    });
});