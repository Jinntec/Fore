describe('todo2 demo spec', () => {
    beforeEach(() => {
        cy.visit('todo2.html');
    });
    // @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
    it('should have h1', () => {
        cy.get('h1')
            .should('contain.text', 'Todo')

        cy.get('#clearbtn').click()

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
