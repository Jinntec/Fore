describe('iterate.html', () => {
	beforeEach(() => {
		cy.visit('iterate.html');
	});

	it('shows the right amount of messages', () => {
		cy.get('[data-cy="show-messages"]').click();

		cy.get('message')
			.should('contain', 'This is the first message!')
			.and('contain', 'And the second!')
			.and('contain', 'And the third!');
	});

	it('can delete, insert and update using the iterate attribute', () => {
		const demo = cy.get('#crud-demo');

		demo.get('#checkbox-A').should('exist');
		demo.get('#checkbox-B').should('exist');
		demo.get('#checkbox-C').should('exist');
		demo.get('#checkbox-D').should('exist');

		demo.get('#remove-btn').click();
		demo.get('#checkbox-A').should('not.exist');
		demo.get('#checkbox-B').should('exist');
		demo.get('#checkbox-C').should('exist');
		demo.get('#checkbox-D').should('not.exist');

		demo.get('#reset-btn').click();
		demo.get('#checkbox-A').should('exist');
		demo.get('#checkbox-B').should('exist');
		demo.get('#checkbox-C').should('exist');
		demo.get('#checkbox-D').should('exist');

		demo.get('#select-all-btn').click();
		demo.get('#checkbox-A input').should('be.checked');
		demo.get('#checkbox-B input').should('be.checked');
		demo.get('#checkbox-C input').should('be.checked');
		demo.get('#checkbox-D input').should('be.checked');

		demo.get('#unselect-all-btn').click();
		demo.get('#checkbox-A input').should('not.be.checked');
		demo.get('#checkbox-B input').should('not.be.checked');
		demo.get('#checkbox-C input').should('not.be.checked');
		demo.get('#checkbox-D input').should('not.be.checked');

		demo.get('#reset-btn').click();

		demo.get('#sort-btn').click();
		demo.get('input[type="checkbox"').eq(0).closest('fx-control').should('contain', 'A');
		demo.get('input[type="checkbox"').eq(1).closest('fx-control').should('contain', 'D');
		demo.get('input[type="checkbox"').eq(2).closest('fx-control').should('contain', 'B');
		demo.get('input[type="checkbox"').eq(3).closest('fx-control').should('contain', 'C');

		demo.get('#reset-btn').click();

		demo.get('#duplicate-selected-btn').click();

		demo.get('[id="checkbox-A"]').should('have.length', 2)
		demo.get('[id="checkbox-B"]').should('have.length', 1)
		demo.get('[id="checkbox-C"]').should('have.length', 1)
		demo.get('[id="checkbox-D"]').should('have.length', 2)
	});
});
