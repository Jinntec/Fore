describe('variables demo spec', () => {
   beforeEach(() => {
       cy.visit('variables.html');
   });

   it('should be shown in templates', () => {
      cy.get('fx-fore > fx-group > p:nth-child(5)')
          .should('contain', 'They can also point to an instance, like this: functional');
  });
	
	it('can update', () => {
		cy.get('input')
			.type('{selectall}{del}performance')
			.blur();
      cy.get('fx-fore > fx-group > p:nth-child(5)')		
			.should('contain', 'They can also point to an instance, like this: performance');
	});

});
