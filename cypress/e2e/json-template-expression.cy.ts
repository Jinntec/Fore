describe('JSON template expressions', () => {
    it('renders {?prop} inside a JSON repeat', () => {
        cy.visit('json/json-template-expressions.html');
        cy.get('fx-fore').should('have.class', 'fx-ready');

        cy.get('[data-cy="row"]').should('have.length', 2);

        cy.get('[data-cy="row"]').eq(0).find('[data-cy="title"]').should('contain.text', 'Blade Runner');
        cy.get('[data-cy="row"]').eq(0).find('[data-cy="year"]').should('contain.text', '1982');

        cy.get('[data-cy="row"]').eq(1).find('[data-cy="title"]').should('contain.text', 'Arrival');
        cy.get('[data-cy="row"]').eq(1).find('[data-cy="year"]').should('contain.text', '2016');
    });
});