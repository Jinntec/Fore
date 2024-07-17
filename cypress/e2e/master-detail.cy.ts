describe('Master-detail.html', () => {
	beforeEach(() => {
		cy.visit('master-detail.html');
	});
	// @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
	it('Should cause a rerender of anything using the index function when it changes', () => {
		cy.get('#days span')
			.should('have.length', 5)

		cy.get('#day-name').should('have.text', 'Monday', 'The initial selection should be with the first day');
		
		cy.get('#day-1')
			.click();

		cy.get('#day-name').should('have.text', 'Tuesday', 'The selection should move to the second day');

		cy.get('#events').contains('CoffeeLunch');

	});
});
