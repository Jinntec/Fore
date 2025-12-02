describe('while demo spec', () => {
   beforeEach (() => {
       cy.visit('while.html');
   });

	it('can count to 10', () => {
		// Make sure we start at an expected state
		cy.get('[data-cy="output"]')
			.should('contain', '0')
		// Start the counter
		cy.get('[data-cy="counter"]')
			.click()
		// Assert the toast is shown
		cy.get('.toastify')
			.should('be.visible')
			.should('contain', 'counted to 10 done')
		// And the counter updated
		cy.get('[data-cy="output"]')
			.should('contain', '10')
		// Test the rest
		cy.get('[data-cy="reset"]')
			.click()
		cy.get('[data-cy="output"]')
			.should('contain', '0')
	});

	it('notify user 10 times', () => {
		cy.get('#counter').should('have.text', '0')
		cy.get('[data-cy="start"]')
			.click()
		cy.get('.toastify')
			.should('have.length', '10')
	})
})
