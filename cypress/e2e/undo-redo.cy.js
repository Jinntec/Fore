/// <reference types="cypress" />

/**
 * Tests for demo/undo-redo.html
 *
 * Covers a more complex, realistic usage than the unit tests:
 * - widget edits, action-driven mutations, insert/delete, reset - all undoable
 * - coalescing of rapid typing into one undo step
 * - keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
 * - a nested fx-fore that owns no fx-instance of its own, operating on the outer's
 *   shared instance, with its own fx-undo/fx-redo correctly reaching the ancestor's history
 */

describe('undo/redo (demo/undo-redo.html)', () => {
  beforeEach(() => {
    cy.visit('undo-redo.html');
    cy.get('fx-fore#basic', { includeShadowDom: true }).should('have.prop', 'ready', true);
  });

  it('undoes and redoes a widget edit on the greeting field', () => {
    cy.get('fx-fore#basic fx-control[ref="greeting"] input', { includeShadowDom: true })
      .clear()
      .type('Hello Cypress')
      .blur();

    cy.get('fx-fore#basic fx-control[ref="greeting"] input', { includeShadowDom: true }).should(
      'have.value',
      'Hello Cypress',
    );

    cy.get('#undo-basic button').click();
    cy.get('fx-fore#basic fx-control[ref="greeting"] input', { includeShadowDom: true }).should(
      'have.value',
      'Hello Universe',
    );

    cy.get('#redo-basic button').click();
    cy.get('fx-fore#basic fx-control[ref="greeting"] input', { includeShadowDom: true }).should(
      'have.value',
      'Hello Cypress',
    );
  });

  it('coalesces rapid typing into a single undo step', () => {
    cy.get('fx-fore#basic > fx-model').then($model => {
      const model = $model[0];
      expect(model.undoManager.undoStack.length).to.equal(0);
    });

    cy.get('fx-fore#basic fx-control[ref="greeting"] input', { includeShadowDom: true })
      .clear()
      .type('fast typing', { delay: 0 })
      .blur();

    cy.get('fx-fore#basic > fx-model').should($model => {
      expect($model[0].undoManager.undoStack.length).to.equal(1);
    });

    // one undo reverts the whole typed string, not one keystroke
    cy.get('#undo-basic button').click();
    cy.get('fx-fore#basic fx-control[ref="greeting"] input', { includeShadowDom: true }).should(
      'have.value',
      'Hello Universe',
    );
  });

  it('inserting and deleting a task are both undoable', () => {
    cy.get('#add-task button').click();
    cy.get('fx-fore#basic fx-repeat fx-control', { includeShadowDom: true }).should(
      'have.length',
      3,
    );

    cy.get('#undo-basic button').click();
    cy.get('fx-fore#basic fx-repeat fx-control', { includeShadowDom: true }).should(
      'have.length',
      2,
    );

    // delete triggered from inside the repeat item that gets removed
    cy.get('fx-fore#basic fx-repeat .delete-task button').first().click();
    cy.get('fx-fore#basic fx-repeat fx-control input', { includeShadowDom: true })
      .first()
      .should('have.value', 'walk the dog');

    cy.get('#undo-basic button').click();
    cy.get('fx-fore#basic fx-repeat fx-control input', { includeShadowDom: true })
      .first()
      .should('have.value', 'wash the dishes');
  });

  it('a reset is itself undoable', () => {
    cy.get('fx-fore#basic fx-control[ref="greeting"] input', { includeShadowDom: true })
      .clear()
      .type('changed')
      .blur();

    cy.get('#reset-basic button').click();
    cy.get('fx-fore#basic fx-control[ref="greeting"] input', { includeShadowDom: true }).should(
      'have.value',
      'Hello Universe',
    );

    cy.get('#undo-basic button').click();
    cy.get('fx-fore#basic fx-control[ref="greeting"] input', { includeShadowDom: true }).should(
      'have.value',
      'changed',
    );
  });

  it('supports Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts', () => {
    cy.get('fx-fore#basic fx-control[ref="greeting"] input', { includeShadowDom: true })
      .clear()
      .type('via keyboard')
      .blur();

    cy.get('fx-fore#basic').trigger('keydown', { key: 'z', ctrlKey: true, bubbles: true });
    cy.get('fx-fore#basic fx-control[ref="greeting"] input', { includeShadowDom: true }).should(
      'have.value',
      'Hello Universe',
    );

    cy.get('fx-fore#basic').trigger('keydown', {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });
    cy.get('fx-fore#basic fx-control[ref="greeting"] input', { includeShadowDom: true }).should(
      'have.value',
      'via keyboard',
    );
  });

  it('a nested fore with no local instance records and undoes on the ancestor sharing its data', () => {
    const sharedCount = () =>
      cy
        .get('fx-fore#shared-outer > fx-model')
        .then(
          $model =>
            $model[0].getInstance('counters').instanceData.querySelector('count').textContent,
        );

    cy.get('#increment button').click();
    sharedCount().should('equal', '1');

    cy.get('fx-fore#shared-inner > fx-model').should($model => {
      expect($model[0].instances.length).to.equal(0);
    });
    cy.get('fx-fore#shared-outer > fx-model').should($model => {
      expect($model[0].undoManager.undoStack.length).to.equal(1);
    });

    cy.get('#undo-shared button').click();
    sharedCount().should('equal', '0');

    cy.get('#redo-shared button').click();
    sharedCount().should('equal', '1');
  });
});
