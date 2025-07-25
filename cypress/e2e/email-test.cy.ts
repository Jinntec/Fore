describe('email embedding test', () => {
  beforeEach(() => {
    cy.visit('controls/email-test.html');
  });

  it('display value from parent"', () => {
    cy.get('input').should('have.value', 'John');
    cy.get('#output').should('have.value', 'John');

    // Clear the input field first, then type the new value
    cy.get('input').clear().type('Doe');

    // Wait for the refresh-done event to be dispatched before checking the output value
    cy.get('fx-fore').should('be.visible');
    cy.wait(100); // Add a small delay to ensure the refresh has completed
    cy.get('#output').should('have.value', 'Doe');
  });
});
