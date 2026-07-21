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

  it('drags a file into a different folder anywhere in the tree (no drop-scope restriction)', () => {
    // Unlike repeat-drop-scope.html, this template has no drop-scope="parent" - every
    // recursion level is synthesized with no id of its own, so the default scoping
    // (nearest ancestor with a literal id) resolves to the single root id="tree" for
    // every node, making the whole tree one drop scope - like a real file browser.
    dragItem('[data-cy="index.js"]', '[data-cy="README.md"]');
    cy.wait(300); // let the async refresh() settle before asserting

    cy.get('[data-cy="src"] [data-cy="index.js"]').should('not.exist');
    cy.get('[data-cy="docs"] [data-cy="index.js"]').should('exist');
  });

  it('can drop into a folder emptied of all its children', () => {
    // Empty "docs" out first by moving its only child, README.md, elsewhere.
    dragItem('[data-cy="README.md"]', '[data-cy="index.js"]');
    cy.wait(300);
    cy.get('[data-cy="docs"] [data-cy="README.md"]').should('not.exist');

    // Regression guard: with no children to render, a folder's own nested fx-repeat
    // (the only element you can drop onto to land inside it) would otherwise collapse
    // to a zero-size box with nothing left to drop onto at all - see the
    // `ul.tree > fx-repeat` rule in this demo's <style>.
    cy.get('[data-cy="docs"] > ul.tree > fx-repeat').then($repeat => {
      const rect = $repeat[0].getBoundingClientRect();
      expect(rect.width).to.be.greaterThan(0);
      expect(rect.height).to.be.greaterThan(0);
    });

    // Drop something back into the now-empty folder by targeting that fx-repeat directly.
    dragItem('[data-cy="README.md"]', '[data-cy="docs"] > ul.tree > fx-repeat');
    cy.wait(300);
    cy.get('[data-cy="docs"] [data-cy="README.md"]').should('exist');
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
