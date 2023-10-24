describe('template spec', () => {
	beforeEach(()=>{
		cy.visit('i18n/i18n.html');
	});

  it('can toggle the language', function() {
    cy.get('[data-cy="EN"]').click();
      cy
		  .get('fx-output')
		  .shadow()
		  .find('#value')
		  .should('contain', 'Description of object');
      cy
		  .get('[data-cy="DE"]')
		  .click();
      cy
		  .get('fx-output')
		  .shadow()
		  .find('#value')
		  .should('contain', 'Objektbeschreibung');
  });
})
