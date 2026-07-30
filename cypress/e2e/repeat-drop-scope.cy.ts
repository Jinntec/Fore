describe('repeat-drop-scope.html', () => {
  beforeEach(() => {
    cy.visit('repeat-drop-scope.html');
    cy.get('fx-fore.fx-ready');
  });

  function dragItem(fromSelector: string, toSelector: string) {
    const target = Cypress.$(toSelector)[0];
    const bcr = target.getBoundingClientRect();
    const dataTransfer = new DataTransfer();
    const offsetY = bcr.height / 2;
    cy.get(fromSelector).trigger('dragstart', { dataTransfer, force: true });
    cy.get(toSelector).trigger('drop', { dataTransfer, offsetY, force: true });
  }

  it('blocks dropping an item into a structurally identical sibling group', () => {
    cy.get('[data-cy="A1"]').should('exist');
    cy.get('[data-cy="B1"]').should('exist');

    dragItem('[data-cy="A1"]', '[data-cy="B1"]');

    // The drop, if wrongly accepted, is applied via an async refresh() - wait for it to
    // settle before asserting nothing changed (a bare .should() count check would pass
    // trivially on the pre-refresh state even when the drop *does* go through).
    cy.wait(300);

    // A1 must still be under Group A, B1's group must be unchanged.
    cy.get('.group').eq(0).find('.item').should('have.length', 2);
    cy.get('.group').eq(0).find('[data-cy="A1"]').should('exist');
    cy.get('.group').eq(1).find('.item').should('have.length', 2);
    cy.get('.group').eq(1).find('[data-cy="B1"]').should('exist');
  });

  it('still allows reordering within the same real parent group', () => {
    cy.get('.group').eq(0).find('.item').first().should('have.attr', 'data-cy', 'A1');

    dragItem('[data-cy="A2"]', '[data-cy="A1"]');

    cy.get('.group').eq(0).find('.item').first().should('have.attr', 'data-cy', 'A2');
    cy.get('.group').eq(0).find('.item').should('have.length', 2);
  });
});
