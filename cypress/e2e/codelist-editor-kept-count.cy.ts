// cypress/e2e/codelist-editor-kept-count.cy.ts
//
// Regression test for the generic ref-dependency tracking + structural-change consumer
// (see demo/codelists/fore-reactivity-bug-findings.md, bug 3): the `.kept-count`
// fx-output's ref is a raw XPath aggregate over Row/@ui-keep, not backed by an fx-bind.
// It used to freeze stale (only a full/forced refresh recomputed it) and the demo carried
// a plain-JS workaround that force-refreshed it from 'action-performed'/'value-changed'
// listeners. That workaround is deleted — the count must now update through the framework
// itself: node observation for value changes, signalChangeToElement() consumption for
// structural changes (fx-delete, first-time fx-setattribute).

const DEMO_URL = 'codelists/codelist-editor.html';
// smallest bundled codelist (21 rows) — keeps the load + per-row iterate loops fast
const CODELIST = 'UNTDID-5305-3.xml';
const ROWS = 21;

// fx-output renders its value into its own shadow DOM (#value span), not light-DOM text,
// so Cypress's .text() (light-DOM textContent) always sees ''. Read the shadow DOM.
function expectKeptCount(kept: number, total: number) {
  cy.get('#kept-count').should($el => {
    const text = $el[0].shadowRoot?.getElementById('value')?.textContent?.trim();
    expect(text).to.equal(`${kept} of ${total} codes kept`);
  });
}

function loadCodelist() {
  cy.visit(DEMO_URL);
  cy.get('#file-select').select(CODELIST);
  // the load flow locks the UI while the submission + per-row iterate loops run
  cy.get('main#editor-main', { timeout: 20000 }).should('not.have.class', 'ui-locked');
  // #r-rows caps its initial render at size="20" (progressive rendering) - this codelist
  // has 21 rows, one past the cap - scroll the list to trigger the sentinel and reveal the
  // rest before any test asserts against the full row count.
  cy.get('.row-list').scrollTo('bottom');
  cy.get('#r-rows > fx-repeatitem', { timeout: 20000 }).should('have.length', ROWS);
}

describe('codelist editor: .kept-count updates without any manual refresh', () => {
  beforeEach(loadCodelist);

  it('is correct right after loading (first-time fx-setattribute over every row)', () => {
    // load stamps ui-keep="true" onto rows that never had the attribute — only the
    // structural-change signal makes the aggregate see those new attribute nodes
    expectKeptCount(ROWS, ROWS);
  });

  it('updates when a single row checkbox is toggled', () => {
    cy.get('#r-rows > fx-repeatitem')
      .first()
      .find('.keep-col input[type="checkbox"]')
      .uncheck();
    expectKeptCount(ROWS - 1, ROWS);

    cy.get('#r-rows > fx-repeatitem')
      .first()
      .find('.keep-col input[type="checkbox"]')
      .check();
    expectKeptCount(ROWS, ROWS);
  });

  it('updates on select none / select all', () => {
    cy.get('#btn-select-none button').click();
    expectKeptCount(0, ROWS);

    cy.get('#btn-select-all button').click();
    expectKeptCount(ROWS, ROWS);
  });

  it('updates on invert selection', () => {
    cy.get('#r-rows > fx-repeatitem')
      .first()
      .find('.keep-col input[type="checkbox"]')
      .uncheck();
    expectKeptCount(ROWS - 1, ROWS);

    cy.get('#btn-invert button').click();
    expectKeptCount(1, ROWS);
  });

  it('updates both halves of the count when unchecked rows are removed (fx-delete)', () => {
    cy.get('#r-rows > fx-repeatitem')
      .first()
      .find('.keep-col input[type="checkbox"]')
      .uncheck();
    expectKeptCount(ROWS - 1, ROWS);

    cy.get('#btn-remove-unchecked button').click();
    // kept count AND total must both update: the deleted row leaves the instance
    expectKeptCount(ROWS - 1, ROWS - 1);
    cy.get('#r-rows > fx-repeatitem').should('have.length', ROWS - 1);
  });
});
