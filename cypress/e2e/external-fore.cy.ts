describe('external-fore.html', () => {
	beforeEach(() => {
		cy.visit('external-fore.html');
	});

	it('can load the external fore component', () => {
		cy.get('#output').shadow().contains('middle');
		cy.get('h2 > fx-output').shadow().contains('left')
	});
})
