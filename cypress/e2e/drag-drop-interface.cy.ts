describe('drag-drop-interface.html', () => {
	beforeEach(() => {
		cy.visit('drag-drop-interface.html');
	});

	function dragItem (fromSelector: string, toSelector: string) {
		const target = Cypress.$(toSelector)[0];
		const bcr = target.getBoundingClientRect();
		const dataTransfer = new DataTransfer();
		const offsetY = bcr.height / 2;
		cy.get(fromSelector)
			.trigger('dragstart', { dataTransfer });
		cy.get(toSelector)
			.trigger('drop', {dataTransfer, offsetY});

	}

	it('can drag an item to the first column', () => {
		// Detect fore fully loaded
		cy.get('.portal > :nth-child(1)').should('not.contain.text', '{"Tasks"}');
		cy.get('.portal > :nth-child(2)').should('contain.text', 'Updates');

		dragItem('.portal > :nth-child(2)', '.portal > :nth-child(1)');

		cy.get('.portal > :nth-child(1)').should('contain.text', 'Updates');
		cy.get('.portal > :nth-child(2)').should('contain.text', 'Tasks');

		dragItem('.portal > :nth-child(2)', '.portal > :nth-child(1)');

		cy.get('.portal > :nth-child(1)').should('contain.text', 'Tasks');
		cy.get('.portal > :nth-child(2)').should('contain.text', 'Updates');

		// Now the other way around!
		dragItem('.portal > :nth-child(1)', '.portal > :nth-child(2)');

		cy.get('.portal > :nth-child(1)').should('contain.text', 'Updates');
		cy.get('.portal > :nth-child(2)').should('contain.text', 'Tasks');
	});
});
