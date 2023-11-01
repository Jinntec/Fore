describe('submission-url-overwrite demo', () => {
  it('passes', () => {
    cy.visit('localhost:8090/demo/submission-url-overwrite.html')
    cy.get('.widget').type('some data{enter}');
    cy.get('fx-output').shadow().find('#value').should('have.text', 'some data');
  })
})
