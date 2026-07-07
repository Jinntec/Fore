// cypress/e2e/bind-cross-instance-relevant.cy.ts
//
// Regression test for: fx-bind's `relevant` facet did not reactively recompute when the
// expression referenced a node in a *different* fx-instance than the bind's own `ref`.
//
// Root cause (see demo/bind-cross-instance-relevant.html for full writeup): fx-bind.js's
// _buildBindGraph() resolved `instanceId` once from the bind's own `ref`, then reused that same
// id for every node referenced inside `relevant` (via _addDependencies). For a cross-instance
// reference this mislabeled the dependency's canonical path, so
// model.mainGraph.dependantsOf(realChangedPath) never found the bind, and compute() was never
// invoked for it again after the initial (load-time) evaluation.
//
// Fix: _addDependencies now resolves each referenced node's OWN instance id (via
// model.getInstanceIdForNode(), a reverse lookup from ownerDocument to fx-instance id) instead of
// reusing the bind's instance id for every reference.
//
// The "same instance" case remains the control group: identical `relevant` expression shape,
// confirming this isn't "relevant just doesn't react to fx-control changes in general".
//
// NOTE: test each spec in isolation (cy.visit() in beforeEach already ensures a fresh page per
// test) -- interacting with both panels' controls in the SAME page load can queue batched
// notifications that a later, unrelated control's commit inadvertently flushes, which can make
// timing look intermittent. Keeping one interaction per test avoids that.

const DEMO_URL = 'bind-cross-instance-relevant.html';

function visibleSameItems() {
  return cy.get('#r-items-same > fx-repeatitem:not([nonrelevant])');
}

function visibleCrossItems() {
  return cy.get('#r-items-cross > fx-repeatitem:not([nonrelevant])');
}

// fx-output renders its value into its own shadow DOM (#value span), not light-DOM text, so
// jQuery's/Cypress's .text() (which reads light-DOM textContent) always sees ''. Read the
// shadow DOM directly instead.
function shadowText($fxOutput: JQuery<HTMLElement>) {
  return $fxOutput[0].shadowRoot?.getElementById('value')?.textContent?.trim() ?? '';
}

describe('fx-bind[relevant] reactivity: same-instance vs cross-instance', () => {
  beforeEach(() => {
    cy.visit(DEMO_URL);
    cy.get('fx-repeat#r-items-same').should('exist');
    cy.get('fx-repeat#r-items-cross').should('exist');
  });

  it('shows all 3 items in both panels before filtering', () => {
    visibleSameItems().should('have.length', 3);
    visibleCrossItems().should('have.length', 3);
  });

  it('same-instance bind reactively narrows down on a plain value change (control group)', () => {
    cy.get('#input-same').type('Alpha');
    visibleSameItems().should('have.length', 1);
    visibleSameItems().find('fx-output').then($el => {
      expect(shadowText($el)).to.equal('Alpha');
    });
  });

  it('cross-instance bind reactively narrows down on a plain value change (bug fixed)', () => {
    cy.get('#input-cross').type('Alpha');
    visibleCrossItems().should('have.length', 1);
    visibleCrossItems().find('fx-output').then($el => {
      expect(shadowText($el)).to.equal('Alpha');
    });
  });

  it('cross-instance bind stays correct after model.updateModel() + a forced refresh (recovery path still works)', () => {
    cy.get('#input-cross').type('Alpha');
    visibleCrossItems().should('have.length', 1);
    cy.get('#btn-updatemodel').click();
    visibleCrossItems().should('have.length', 1);
    visibleCrossItems().find('fx-output').then($el => {
      expect(shadowText($el)).to.equal('Alpha');
    });
  });
});
