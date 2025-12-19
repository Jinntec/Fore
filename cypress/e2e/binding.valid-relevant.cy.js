/// <reference types="cypress" />

/**
 * Binding demo – facet events & states
 *
 * Covers the previously-missing assertions for:
 * - valid / invalid
 * - relevant / nonrelevant
 *
 * Notes:
 * - The demo uses <fx-message event="..."> but the most robust signal is the actual
 *   custom event dispatched on the <fx-control>.
 * - We also assert the control's validity/relevance attributes and aria-invalid on the widget.
 */

// Adjust this path if your dev server serves demos elsewhere:
const PAGE = 'binding.html';

function listenOnceOnControl(eventName, alias) {
  cy.get('fx-control#input').then($ctrl => {
    const el = $ctrl[0];
    const spy = cy.spy().as(alias);
    el.addEventListener(eventName, spy, { once: true });
  });
}

function waitForForeReady() {
  // Control should be present and upgraded
  cy.get('fx-control#input', { timeout: 20000 }).should('exist');

  // Initial state in binding.html: required=true, constraint=true, relevant=true, item='Hello'
  // Depending on init timing, attributes might be applied shortly after.
  cy.get('fx-control#input', { timeout: 20000 }).should('not.have.attr', 'nonrelevant');
}

describe('Binding demo: valid/invalid + relevant/nonrelevant', () => {
  beforeEach(() => {
    cy.visit(PAGE);
    waitForForeReady();
  });

  it('fires invalid then valid when toggling constraint, and syncs aria-invalid', () => {
    // Go invalid
    listenOnceOnControl('invalid', 'onInvalid');
    cy.get('button[data-cy="invalid"]').click();

    cy.get('@onInvalid').should('have.been.calledOnce');

    cy.get('fx-control#input').should('have.attr', 'invalid');
    cy.get('fx-control#input').should('not.have.attr', 'valid');

    // The widget should reflect invalid state
    cy.get('fx-control#input input')
      .should('have.attr', 'aria-invalid', 'true');

    // Go valid again
    listenOnceOnControl('valid', 'onValid');
    cy.get('button[data-cy="valid"]').click();

    cy.get('@onValid').should('have.been.calledOnce');

    cy.get('fx-control#input').should('have.attr', 'valid');
    cy.get('fx-control#input').should('not.have.attr', 'invalid');

    cy.get('fx-control#input input')
      .should('have.attr', 'aria-invalid', 'false');
  });

  it('fires nonrelevant then relevant when toggling relevance, and updates attributes', () => {
    // Go nonrelevant
    listenOnceOnControl('nonrelevant', 'onNonrelevant');
    cy.get('button[data-cy="non"]').click();

    cy.get('@onNonrelevant').should('have.been.calledOnce');

    cy.get('fx-control#input').should('have.attr', 'nonrelevant');
    cy.get('fx-control#input').should('not.have.attr', 'relevant');

    // Go relevant again
    listenOnceOnControl('relevant', 'onRelevant');
    cy.get('button[data-cy="relevant"]').click();

    cy.get('@onRelevant').should('have.been.calledOnce');

    cy.get('fx-control#input').should('have.attr', 'relevant');
    cy.get('fx-control#input').should('not.have.attr', 'nonrelevant');
  });

  it('does not re-fire valid/invalid if clicking same state twice', () => {
    // Ensure we are valid first
    cy.get('button[data-cy="valid"]').click();
    cy.get('fx-control#input').should('have.attr', 'valid');

    // First: go invalid (event should fire)
    listenOnceOnControl('invalid', 'onInvalidOnce');
    cy.get('button[data-cy="invalid"]').click();
    cy.get('@onInvalidOnce').should('have.been.calledOnce');

    // Second: click invalid again (event should NOT fire again)
    cy.get('fx-control#input').then($ctrl => {
      const el = $ctrl[0];
      const spy = cy.spy().as('onInvalidTwice');
      el.addEventListener('invalid', spy);
    });

    cy.get('button[data-cy="invalid"]').click();
    // Give Fore a tick; if it re-fires, spy would be called.
    cy.wait(50);
    cy.get('@onInvalidTwice').should('not.have.been.called');

    // First: go valid (event should fire)
    listenOnceOnControl('valid', 'onValidOnce');
    cy.get('button[data-cy="valid"]').click();
    cy.get('@onValidOnce').should('have.been.calledOnce');

    // Second: click valid again (event should NOT fire)
    cy.get('fx-control#input').then($ctrl => {
      const el = $ctrl[0];
      const spy = cy.spy().as('onValidTwice');
      el.addEventListener('valid', spy);
    });

    cy.get('button[data-cy="valid"]').click();
    cy.wait(50);
    cy.get('@onValidTwice').should('not.have.been.called');
  });

  it('does not re-fire relevant/nonrelevant if clicking same state twice', () => {
    // Ensure we are relevant first
    cy.get('button[data-cy="relevant"]').click();
    cy.get('fx-control#input').should('have.attr', 'relevant');

    // First: go nonrelevant (event should fire)
    listenOnceOnControl('nonrelevant', 'onNonOnce');
    cy.get('button[data-cy="non"]').click();
    cy.get('@onNonOnce').should('have.been.calledOnce');

    // Second: click nonrelevant again (event should NOT fire)
    cy.get('fx-control#input').then($ctrl => {
      const el = $ctrl[0];
      const spy = cy.spy().as('onNonTwice');
      el.addEventListener('nonrelevant', spy);
    });

    cy.get('button[data-cy="non"]').click();
    cy.wait(50);
    cy.get('@onNonTwice').should('not.have.been.called');

    // First: go relevant (event should fire)
    listenOnceOnControl('relevant', 'onRelOnce');
    cy.get('button[data-cy="relevant"]').click();
    cy.get('@onRelOnce').should('have.been.calledOnce');

    // Second: click relevant again (event should NOT fire)
    cy.get('fx-control#input').then($ctrl => {
      const el = $ctrl[0];
      const spy = cy.spy().as('onRelTwice');
      el.addEventListener('relevant', spy);
    });

    cy.get('button[data-cy="relevant"]').click();
    cy.wait(50);
    cy.get('@onRelTwice').should('not.have.been.called');
  });
});
