describe('template spec', () => {
	beforeEach(() => {
		cy.visit('i18n/i18n.html');
		cy.get('fx-fore.fx-ready', { timeout: 10000 }).should('exist');
	});

	it('can toggle the language', () => {
		cy.get('fx-fore.fx-ready').first().within(() => {
			cy.get('[data-cy="EN"]').click();
			cy.get('fx-output')
				.shadow()
				.find('#value')
				.should('contain', 'Description of object');

			cy.get('[data-cy="DE"]').click();
			cy.get('fx-output')
				.shadow()
				.find('#value')
				.should('contain', 'Objektbeschreibung');
		});
	});
});