describe('repeat-recursive.html', () => {
  beforeEach(() => {
    cy.visit('repeat-recursive.html');
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

  it('renders the full arbitrary-depth tree from a single template', () => {
    cy.get('[data-cy]').should('have.length', 7);
    cy.get('[data-cy="ui"] [data-cy="fx-repeat.js"]').should('exist');
    cy.get('[data-cy="docs"] [data-cy="README.md"]').should('exist');
    cy.get('fx-repeat-ref').should('have.length', 0);
  });

  it('adds a child under a node via the recursive template, nested at the right spot', () => {
    cy.get('[data-cy="docs"]')
      .find('> .row > fx-trigger button[data-cy-action="add"]')
      .first()
      .click({ force: true });

    cy.get('[data-cy="docs"] [data-cy="new-file"]').should('exist');
    // Must not have landed anywhere else (e.g. under "src").
    cy.get('[data-cy="src"] [data-cy="new-file"]').should('not.exist');
  });

  it('deletes a node and its whole rendered subtree, leaving siblings untouched', () => {
    cy.get('[data-cy="ui"]')
      .find('> .row > fx-trigger button[data-cy-action="delete"]')
      .first()
      .click({ force: true });

    cy.get('[data-cy="ui"]').should('not.exist');
    cy.get('[data-cy="fx-repeat.js"]').should('not.exist');
    cy.get('[data-cy="fx-repeat-ref.js"]').should('not.exist');
    // Untouched siblings/ancestor survive.
    cy.get('[data-cy="src"]').should('exist');
    cy.get('[data-cy="index.js"]').should('exist');
  });

  it('drop-scope="parent" blocks dragging a file into a structurally identical sibling folder', () => {
    dragItem('[data-cy="index.js"]', '[data-cy="README.md"]');
    cy.wait(300); // let a wrongly-accepted drop's async refresh() settle before asserting

    cy.get('[data-cy="src"] [data-cy="index.js"]').should('exist');
    cy.get('[data-cy="docs"] [data-cy="index.js"]').should('not.exist');
  });

  it('selects a node via the @ui-selected marker, readable from outside the tree', () => {
    // fx-output renders its value inside a shadow root - .shadow() pierces it (see on-demand.cy.ts).
    const selectedOutput = () => cy.get('fx-output[ref*="ui-selected"]').shadow().find('#value');

    cy.get('[data-cy="fx-repeat-ref.js"]')
      .find('> .row > fx-trigger button[data-cy-action="select"]')
      .click({ force: true });

    // Marker is reflected as a plain DOM attribute and picked up generically by fore.css.
    cy.get('[data-cy="fx-repeat-ref.js"]').should('have.attr', 'ui-selected', 'true');
    cy.get('[data-cy="index.js"]').should('not.have.attr', 'ui-selected', 'true');

    // Readback from outside the tree entirely (stand-in for a property panel).
    selectedOutput().should('have.text', 'fx-repeat-ref.js');

    // Selecting a different node clears the previous marker.
    cy.get('[data-cy="README.md"]')
      .find('> .row > fx-trigger button[data-cy-action="select"]')
      .click({ force: true });

    cy.get('[data-cy="fx-repeat-ref.js"]').should('not.have.attr', 'ui-selected', 'true');
    cy.get('[data-cy="README.md"]').should('have.attr', 'ui-selected', 'true');
    selectedOutput().should('have.text', 'README.md');
  });

  it('selects a node on plain keyboard focus (activate-on-focus), not just click', () => {
    const selectedOutput = () => cy.get('fx-output[ref*="ui-selected"]').shadow().find('#value');

    cy.get('[data-cy="ui"]')
      .find('> .row > fx-trigger button[data-cy-action="select"]')
      .focus();

    cy.get('[data-cy="ui"]').should('have.attr', 'ui-selected', 'true');
    selectedOutput().should('have.text', 'ui');

    // Moving focus elsewhere (not a select button) must not clear the selection.
    cy.get('[data-cy="ui"]')
      .find('> .row > fx-trigger button[data-cy-action="add"]')
      .focus();

    cy.get('[data-cy="ui"]').should('have.attr', 'ui-selected', 'true');
  });
});
