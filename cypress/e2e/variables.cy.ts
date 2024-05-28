describe('variables demo spec', () => {
   beforeEach(() => {
       cy.visit('variables.html');
   });

   it('should be shown in templates', () => {
      cy.get('ins')
          .should('contain', 'a value');
  });

	// Skipping for now, while we figure out how to use variables that resolve to node sequences. The are difficult to pass to FontoXPath.
	it('can update', () => {
		cy.get('select')
			.select('performance')
      cy.get('fx-fore > fx-group > p:nth-child(8)')
			.should('contain', 'There are 2 requirements!');
	});
});
