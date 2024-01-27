describe('shared instances', () => {
	beforeEach(() => {
		cy.visit('shared-instances.html');
	});

	it('should share data with nested Fores', () => {
		cy.get('h1')
		.should('contain', 'Shared instances')
		cy.get('h2 span')
			.should('contain', '4')
		cy.get('#todo #outer fx-repeatitem:nth-child(1) fx-control:nth-child(1) .widget')
			.should('have.value', 'Fix this!');
		cy.get('#todo #outer fx-repeatitem:nth-child(2) fx-control:nth-child(1) .widget')
			.should('have.value', 'Fix this as well!');
		cy.get('#todo #outer fx-repeatitem:nth-child(3) fx-control:nth-child(1) .widget')
			.should('have.value', 'Why is this not fixed yet?!');
		cy.get('#todo #outer fx-repeatitem:nth-child(4) fx-control:nth-child(1) .widget')
			.should('have.value', 'Write tests');

		cy.get('#todo #child-a h3 span')
			.should('contain', '4');
		cy.get('#todo #child-a fx-repeatitem:nth-child(1) p')
			.should('contain', 'Fix this! - You can do it!');
		cy.get('#todo #child-a fx-repeatitem:nth-child(2) p')
			.should('contain', 'Fix this as well! - You can do it!');
		cy.get('#todo #child-a fx-repeatitem:nth-child(3) p')
			.should('contain', 'Why is this not fixed yet?! - You can do it!');
		cy.get('#todo #child-a fx-repeatitem:nth-child(4) p')
			.should('contain', 'Write tests - You can do it!');

		cy.get('#todo #child-b h3 span')
			.should('contain', '4');
		cy.get('#todo #child-b fx-repeatitem:nth-child(1) fx-control .widget')
			.should('have.value', 'Fix this!');
		cy.get('#todo #child-b fx-repeatitem:nth-child(2) fx-control .widget')
			.should('have.value', 'Fix this as well!');
		cy.get('#todo #child-b fx-repeatitem:nth-child(3) fx-control .widget')
			.should('have.value', 'Why is this not fixed yet?!');
		cy.get('#todo #child-b fx-repeatitem:nth-child(4) fx-control .widget')
			.should('have.value', 'Write tests');

	});

	it('propagates all mutations to all sharing parties updating them all needed', () => {
		cy.get('#addouter')
			.click()

		// there's a new entry
		cy.get('#outer fx-repeatitem:nth-child(5) fx-control .widget')
			.should('have.value', '');

		cy.get('#todo #child-a fx-repeatitem:nth-child(5) p')
			.should('contain', ' - You can do it!');

		cy.get('#todo #child-b fx-repeatitem:nth-child(5) fx-control .widget')
			.should('have.value', '');

		// change parent
		cy.get('#outer fx-repeatitem:nth-child(5) fx-control .widget')
			.type('chill ma')
			.should('have.value','chill ma')
		cy.get('#todo #child-a fx-repeatitem:nth-child(5) p')
			.should('contain', 'chill ma - You can do it!');
		cy.get('#todo #child-b fx-repeatitem:nth-child(5) fx-control .widget')
			.should('have.value', 'chill ma');

		// change child-b
/*
		cy.get('#todo #child-b fx-repeatitem:nth-child(5) fx-control .widget')
			.type('chill more')
			.should('have.value', 'chill more');

		cy.get('#todo #child-a fx-repeatitem:nth-child(5) p')
			.should('contain', 'chill more - You can do it!');
*/

	})

});
