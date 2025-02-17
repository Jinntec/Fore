describe('binding.html', () => {
	beforeEach(() => {
		cy.visit('test/events.html');
	});

	it('handles bubbling event"', () => {
		cy.get('#result').should('contain.text', 'group');
	});

});
