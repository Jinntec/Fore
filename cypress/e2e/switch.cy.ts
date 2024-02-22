describe('switch demo spec', () => {
   beforeEach(() => {
       cy.visit('switch.html');
   });
  it('should be able to switch between items', () => {
	  cy.get('fx-switch.second').scrollIntoView();
	  cy.get('fx-switch.second [name="page1"]').should('not.be.visible');
	  cy.get('fx-switch.second [name="page2"]').should('be.visible');
	  cy.get('fx-switch.second [name="page3"]').should('not.be.visible');
	  cy.get('fx-switch.second [name="page2"]').should('contain.text', 'This is page2');

      cy.get('select.widget').select('page3')

	  cy.get('fx-switch.second [name="page1"]').should('not.be.visible');
	  cy.get('fx-switch.second [name="page2"]').should('not.be.visible');
	  cy.get('fx-switch.second [name="page3"]').should('be.visible');
	  cy.get('fx-switch.second [name="page3"]').should('contain.text', 'This is page3');

	  cy.get('select.widget').select('page1')

	  cy.get('fx-switch.second [name="page1"]').should('be.visible');
	  cy.get('fx-switch.second [name="page2"]').should('not.be.visible');
	  cy.get('fx-switch.second [name="page3"]').should('not.be.visible');
	  cy.get('fx-switch.second [name="page1"]').should('contain.text', 'This is page1');
  });
});
