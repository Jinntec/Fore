describe('date-parts.html', () => {
  beforeEach(() => {
    cy.visit('date-parts.html');
  });

  it('splits the date into year, month and day selects', () => {
    // the nested fore is loaded async - its selects appear once it is ready
    cy.get('select[data-cy="year"]', { timeout: 10000 }).should('have.value', '2026');
    cy.get('select[data-cy="month"]').should('have.value', '10');
    cy.get('select[data-cy="day"]').should('have.value', '15');
  });

  it('joins the parts back into the node', () => {
    cy.get('select[data-cy="year"]', { timeout: 10000 }).should('have.value', '2026');

    cy.get('select[data-cy="year"]').select('2027');
    cy.get('select[data-cy="month"]').select('03');
    cy.get('select[data-cy="day"]').select('07');

    cy.get('fx-output[data-cy="value"]')
      .shadow()
      .find('#value')
      .should('contain', '2027-03-07');
  });

  it('shares the lang instance with the nested fore', () => {
    cy.get('select[data-cy="year"]', { timeout: 10000 }).should('have.value', '2026');
    cy.get('#year label').should('contain', 'Year');

    cy.get('[data-cy="DE"]').click();

    // the labels inside the nested fore follow the language switch
    cy.get('#year label').should('contain', 'Jahr');
    cy.get('#month label').should('contain', 'Monat');
    cy.get('#day label').should('contain', 'Tag');
    // and the parts survive it
    cy.get('select[data-cy="year"]').should('have.value', '2026');
    cy.get('select[data-cy="month"]').should('have.value', '10');
    cy.get('select[data-cy="day"]').should('have.value', '15');
  });
});
