describe('todo2 demo spec', () => {
    beforeEach(() => {
        cy.visit('todo2.html');
    });
    // @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
    it('should have h1', () => {
        cy.get('h1')
            .should('contain.text', 'Todo')

        cy.get('#clearbtn').click()

        // #clearbtn triggers an async submission that deletes localStorage data, then
        // fx-reload does a full window.location.reload() on submit-done. Wait for that
        // reload to actually finish (repeat back to its initial 2 tasks) before
        // interacting further, otherwise commands race the navigation and Cypress
        // sees the target element detached mid-command.
        cy.get('fx-repeatitem').should('have.length', 2)

        cy.get('.btn.add').click()

        cy.get('#task').type('foo')

        cy.get('.btn.add').click()

        cy.get('#task').type('bar')

        // cy.get('#completeCtrl').click()
        // cy.get('fx-repeatitem').should('be.hidden');

    });

	it('should send out the item-changed events correctly', () => {
		cy.get('.add').click();
        cy.get('#task').type('foo')

		cy.get('.add').click();
        cy.get('#task').type('bar')


		cy.get('#r-task').then((taskRepeat) => {
			taskRepeat[0].addEventListener('item-changed', cy.stub().as('item-changed'))
		});

		cy.get('[data-cy="task-1"]').click();
		cy.get('@item-changed').should('have.been.calledOnce', 'First click, first item change');

		cy.get('[data-cy="task-0"]').click();
		cy.get('@item-changed').should('have.been.calledTwice', 'Second click, second item change');

	});
});
