describe('kanban.html', () => {
  beforeEach(() => {
    cy.visit('kanban.html');
  });

  function dragItem(fromSelector: string, toSelector: string, beforeOrAfter: 'before' | 'after') {
    const target = Cypress.$(toSelector)[0];
    const bcr = target.getBoundingClientRect();
    const dataTransfer = new DataTransfer();
    const offsetY = 10000;
    cy.get(fromSelector).trigger('dragstart', { dataTransfer, force: true });
    // Pass 'force': true to prevent Cypress from finding a closer drop target. We explicitly
    // want to drop in the selected element
    cy.get(toSelector).trigger('drop', 'center', { dataTransfer, offsetY, force: true });
  }

  it('can drag an item to before the first one', () => {
    cy.get('fx-fore.fx-ready');
    cy.get('[data-cy="todo-0"]').should('exist');
    cy.get('[data-cy="doing-0"]').should('exist');

    dragItem('[data-cy="todo-0"]', '[data-cy="doing-0"]', 'before');
    cy.get('[data-cy="doing-0"]').should('have.attr', 'data-cy-name', 'launch preps');

    dragItem('[data-cy="doing-0"]', '[data-cy="doing-1"]', 'after');
    cy.get('[data-cy="doing-1"]').should('have.attr', 'data-cy-name', 'launch preps');

    // This is a no-op
    dragItem('[data-cy="doing-1"]', '[data-cy="doing-1"]', 'after');
    cy.get('[data-cy="doing-1"]').should('have.attr', 'data-cy-name', 'launch preps');
  });

  it('can drag an item to the end', () => {
    cy.get('fx-fore.fx-ready');
    cy.get('[data-cy="todo-0"]').should('exist');

    dragItem('[data-cy="todo-0"]', '[data-cy="doing"]', 'after');
    cy.get('[data-cy="doing-2"]').should('have.attr', 'data-cy-name', 'launch preps');
  });
});
