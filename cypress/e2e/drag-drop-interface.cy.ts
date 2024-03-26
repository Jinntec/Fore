describe('drag-drop-interface.html', () => {
	beforeEach(() => {
		cy.visit('drag-drop-interface.html');
	});

	function dragItem (fromSelector: string, toSelector: string, beforeOrAfter: 'before'|'after') {
		const target = Cypress.$(toSelector)[0];
		const bcr = target.getBoundingClientRect();
		const dataTransfer = new DataTransfer();
		const offsetY = bcr.height / 2 + (beforeOrAfter === 'before' ? -10 : 10);
		cy.get(fromSelector)
			.trigger('dragstart', { dataTransfer });
		cy.get(toSelector)
			.trigger('drop', {dataTransfer, offsetY});

	}

	it('can drag an item to the first column', () => {
		dragItem(':nth-child(3) > fx-droptarget > [draggable="true"]', ':nth-child(1) > fx-droptarget', 'before');

		cy.get(':nth-child(1) > fx-droptarget h3')
			.should('have.text', 'Annotations panel');
		cy.get(':nth-child(1) > fx-droptarget input').should('have.value', 'My Data');

		dragItem(':nth-child(1) > fx-droptarget > [draggable="true"]', '.columns :nth-child(2) > fx-droptarget', 'before');

		cy.get(':nth-child(1) > fx-droptarget h3').should('not.exist');
		cy.get(':nth-child(2) > fx-droptarget h3')
			.should('have.text', 'Annotations panel');
		cy.get(':nth-child(2) > fx-droptarget input').should('have.value', 'My Data');
	});
});
