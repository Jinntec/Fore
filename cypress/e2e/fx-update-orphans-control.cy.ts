// cypress/e2e/fx-update-orphans-control.cy.ts
//
// Regression test for a fixed bug: an fx-control with <fx-update event="value-changed"> used to
// only fire value-changed (and re-render any UI bound to that same node) for the FIRST value
// commit. After that it got permanently stuck -- not a whole-page freeze (unrelated ModelItems,
// even ones recalculated on every keystroke, kept updating fine).
//
// Root cause (see demo/fx-update-orphans-control.html for full writeup): rebuild() only
// re-registers ModelItems that go through an <fx-bind>'s init(). A ModelItem lazily created for a
// plain fx-control/fx-output ref (no <fx-bind> of its own) never goes through that path, so it was
// silently dropped from `modelItems` on the very next rebuild -- orphaning any UI element still
// observing it (it kept its ModelItem reference, but that ModelItem never got recalculated or
// notified again). Fixed in fx-model.js's rebuild() by reclaiming any such synthetic ModelItem
// whose backing node is still attached to its instance document.

const DEMO_URL = 'fx-update-orphans-control.html';

function shadowText(id: string) {
  return cy.get(`#${id}`).then($el => $el[0].shadowRoot?.getElementById('value')?.textContent?.trim() ?? '');
}

describe('fx-update no longer orphans the modelItem it was triggered from', () => {
  beforeEach(() => {
    cy.visit(DEMO_URL);
    cy.get('#input-query').should('exist');
  });

  it('fires value-changed and updates same-node output on the first commit', () => {
    cy.get('#input-query').type('a');
    cy.get('#fired-count').should('have.text', '1');
    shadowText('out-query').then(text => expect(text).to.equal('a'));
  });

  it('keeps firing value-changed on every subsequent commit', () => {
    cy.get('#input-query').type('a');
    cy.get('#fired-count').should('have.text', '1');

    cy.get('#input-query').type('b');
    cy.wait(300);
    cy.get('#fired-count').should('have.text', '2');
  });

  it('same-node fx-output keeps updating after the first commit, alongside an unrelated calculated output', () => {
    cy.get('#input-query').type('a');
    cy.wait(200);
    shadowText('out-query').then(text => expect(text).to.equal('a'));
    shadowText('out-counter').then(text => expect(text).to.equal('1'));

    cy.get('#input-query').type('bc');
    cy.wait(300);

    // out-query keeps reflecting every commit now, not just the first...
    shadowText('out-query').then(text => expect(text).to.equal('abc'));
    // ...alongside the unrelated calculated node (recomputed fresh every keystroke).
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
