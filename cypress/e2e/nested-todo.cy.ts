describe('nested todo', () => {
	beforeEach(() => {
		cy.visit('nested-todo.html');
	});

	it('should allow adding and removing items', () => {
		cy
			.get('[data-cy="task-widget-0-0"] > .widget')
			.should('have.value', 'go to store')

		cy
			.get('[data-cy="remove-task-button-0-0"]')
			.click()

		// The repeat should have updated with a new value!
		cy
			.get('[data-cy="task-widget-0-0"] > .widget')
			.should('have.value', 'find milk');
		cy
			.get('[data-cy="task-widget-0-1"] > .widget')
			.should('have.value', 'pay milk')
		cy
			.get('[data-cy="remove-task-button-0-0"]')
			.click();

		cy
			.get('[data-cy="task-widget-0-1"] > .widget')
			.should('have.value', 'take it home');

		cy
			.get('#r-todos > :nth-child(1) > :nth-child(4) > button')
			.click()

		cy
			.get('[data-cy="task-widget-0-2"] > .widget')
			.type('Drink it!')
			.should('have.value', 'Drink it!')
	});
});
