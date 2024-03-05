describe('binding.html', () => {
	beforeEach(() => {
		cy.visit('kanban.html');
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

	it('can drag an item to before the first one', () => {
		dragItem('[data-cy="todo-0"]', '[data-cy="doing-0"]', 'before');
		cy.get('[data-cy="doing-0"]').should('have.attr', 'data-cy-name', 'launch preps')

		dragItem('[data-cy="doing-0"]', '[data-cy="doing-1"]', 'after');
		cy.get('[data-cy="doing-1"]').should('have.attr', 'data-cy-name', 'launch preps')

		// This is a no-op
		dragItem('[data-cy="doing-1"]', '[data-cy="doing-1"]', 'after');
		cy.get('[data-cy="doing-1"]').should('have.attr', 'data-cy-name', 'launch preps')
});

	it('can drag an item to the end', () => {
		dragItem('[data-cy="todo-0"]', '[data-cy="doing"]', 'before');
		cy.get('[data-cy="doing-2"]').should('have.attr', 'data-cy-name', 'launch preps');
	});
});
