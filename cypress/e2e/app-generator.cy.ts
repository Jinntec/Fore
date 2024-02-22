describe('app-generator.html', () => {
	beforeEach(() => {
		cy.visit('tp/app-generator.html');
	});

	it('shows content of first case', () => {
		cy.get('fx-case:nth-child(1)')
			.should('contain','the odds used')

		cy.get('#layoutCaseBtn').click()

		cy.get('fx-case:nth-child(2) fx-repeatitem')
			.should('have.length', 3)

		cy.get('#featureCaseBtn').click()

		cy.get('fx-case:nth-child(3)')
			.should('contain','features')

	});

});
