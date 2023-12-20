describe('binding.html', () => {
	beforeEach(() => {
		cy.visit('binding.html');
	});

	it('toggle the "required buttons"', () => {
		cy.get('[data-cy="required"]').click()

		cy.get('#input input').should('have.attr', 'required');
		cy.get('[data-cy="optional"]').click();
		cy.get('#input input').should('not.have.attr', 'required');

		// Assert the toast is shown
		cy.get('.toastify')
			.should('be.visible')
			.should('contain', 'optional event fired');
				cy.get('[data-cy="required"]').click()

		cy.get('#input input').should('have.attr', 'required')

		// Assert the toast is shown
		cy.get('.toastify')
			.should('be.visible')
			.should('contain', 'required event fired');
	});

	it('toggle the "readonly"', () => {
		cy.get('[data-cy="readonly"').click()
		cy.get('#input input').should('have.attr', 'readonly')

		cy.get('[data-cy="readwrite"]').click();
		cy.get('#input input').should('not.have.attr', 'readonly');

		// Assert the toast is shown
		cy.get('.toastify')
			.should('be.visible')
			.should('contain', 'readwrite event fired');

		cy.get('[data-cy="readonly"').click()
		cy.get('#input input').should('have.attr', 'readonly')

		// Assert the toast is shown
		cy.get('.toastify')
			.should('be.visible')
			.should('contain', 'readonly event fired');
	});
});
