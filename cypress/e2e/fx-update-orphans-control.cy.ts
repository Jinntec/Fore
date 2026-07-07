// cypress/e2e/fx-update-orphans-control.cy.ts
//
// Regression test for: an fx-control with <fx-update event="value-changed"> only fires
// value-changed (and re-renders any UI bound to that same node) for the FIRST value commit.
// After that, it's permanently stuck -- not a whole-page freeze (unrelated ModelItems, even ones
// recalculated on every keystroke, keep updating fine).
//
// Root cause (see demo/fx-update-orphans-control.html for full writeup): <fx-update> calls
// model.updateModel() -> rebuild(), which retargets ModelItems by path while the very node whose
// change triggered the update is mid-flight. That node's bound-UI-element/observer list does not
// survive the retarget; every other ModelItem, built fresh with no concurrent write in flight,
// keeps working.

const DEMO_URL = 'fx-update-orphans-control.html';

function shadowText(id: string) {
  return cy.get(`#${id}`).then($el => $el[0].shadowRoot?.getElementById('value')?.textContent?.trim() ?? '');
}

describe('fx-update orphans the modelItem it was triggered from', () => {
  beforeEach(() => {
    cy.visit(DEMO_URL);
    cy.get('#input-query').should('exist');
  });

  it('fires value-changed and updates same-node output on the first commit', () => {
    cy.get('#input-query').type('a');
    cy.get('#fired-count').should('have.text', '1');
    shadowText('out-query').then(text => expect(text).to.equal('a'));
  });

  it('does NOT fire value-changed again on subsequent commits (documents the bug)', () => {
    cy.get('#input-query').type('a');
    cy.get('#fired-count').should('have.text', '1');

    cy.get('#input-query').type('b');
    cy.wait(300);
    // Desired behavior once fixed: '2'. Today it stays at '1' -- this documents the bug.
    cy.get('#fired-count').should('have.text', '1');
  });

  it('same-node fx-output freezes after the first commit, while an unrelated calculated output keeps updating', () => {
    cy.get('#input-query').type('a');
    cy.wait(200);
    shadowText('out-query').then(text => expect(text).to.equal('a'));
    shadowText('out-counter').then(text => expect(text).to.equal('1'));

    cy.get('#input-query').type('bc');
    cy.wait(300);

    // The bug: out-query stays frozen at the first-ever committed value...
    shadowText('out-query').then(text => expect(text).to.equal('a'));
    // ...even though the unrelated calculated node (recomputed fresh every keystroke) is fine,
    // proving this isn't a whole-page freeze.
    shadowText('out-counter').then(text => expect(text).to.equal('3'));
  });

  it('the raw instance data itself stays correct throughout (setValue()/widget->model direction is unaffected)', () => {
    cy.get('#input-query').type('abc');
    cy.wait(300);
    cy.window().then(win => {
      const node = win.document.querySelector('fx-instance#data')!.instanceData.querySelector('query');
      expect(node?.textContent).to.equal('abc');
    });
  });
});
