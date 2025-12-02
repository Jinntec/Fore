describe('repeat-attributes-5.html', () => {
	beforeEach(() => {
		cy.visit('repeat-attributes-5.html');
	});

	it('creates dynamic datalist"', () => {
		// wait until fore is fully ready
		cy.get('fx-fore.fx-ready').click();

		// initial number of rendered items
		cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 18);

		cy.get('fx-repeat-attributes').should('have.attr', 'index', '1');
		cy.get('fx-repeat-attributes .fx-repeatitem').eq(0).should('have.attr', 'repeat-index');
	});
});