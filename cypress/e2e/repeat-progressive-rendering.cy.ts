// cypress/e2e/repeat-progressive-rendering.cy.ts
//
// Covers fx-repeat's `size` progressive-rendering cap (Phase 1 of the repeat virtualization
// roadmap, see .claude/plans/fore-repeat-virtualization.md) using the codelist-editor demo's
// #r-rows repeat, which carries size="20" and is loaded here with a 21-row codelist - one row
// past the cap, a real boundary case.

const DEMO_URL = 'codelists/codelist-editor.html';
const CODELIST = 'UNTDID-5305-3.xml';
const ROWS = 21;
const SIZE = 20;

function loadCodelist() {
  cy.visit(DEMO_URL);
  cy.get('#file-select').select(CODELIST);
  cy.get('main#editor-main', { timeout: 20000 }).should('not.have.class', 'ui-locked');
}

describe('fx-repeat progressive rendering (size)', () => {
  beforeEach(loadCodelist);

  it('initially materializes only `size` rows, keeping the full nodeset logically', () => {
    cy.get('#r-rows > fx-repeatitem', { timeout: 20000 }).should('have.length', SIZE);
    cy.get('#r-rows').should($el => {
      expect(($el[0] as any).nodeset.length).to.equal(ROWS);
    });
  });

  it('reveals the remaining row(s) when scrolled into view', () => {
    cy.get('#r-rows > fx-repeatitem', { timeout: 20000 }).should('have.length', SIZE);

    cy.get('.row-list').scrollTo('bottom');

    cy.get('#r-rows > fx-repeatitem', { timeout: 5000 }).should('have.length', ROWS);
    cy.get('#r-rows .fx-repeat-sentinel').should('not.exist');
  });

  it('kept-count aggregate reflects the full 21-row dataset immediately, before any scroll', () => {
    // .kept-count is an XPath aggregate over the full instance, not scoped to rendered DOM
    // rows, so it must read 21 of 21 even while only 20 rows are materialized.
    cy.get('#r-rows > fx-repeatitem', { timeout: 20000 }).should('have.length', SIZE);
    cy.get('#kept-count').should($el => {
      const text = $el[0].shadowRoot?.getElementById('value')?.textContent?.trim();
      expect(text).to.equal(`${ROWS} of ${ROWS} codes kept`);
    });
  });

  it('bulk select-all/select-none affects every row, including ones never rendered', () => {
    cy.get('#r-rows > fx-repeatitem', { timeout: 20000 }).should('have.length', SIZE);

    cy.get('#btn-select-none button').click();
    cy.get('#kept-count').should($el => {
      const text = $el[0].shadowRoot?.getElementById('value')?.textContent?.trim();
      expect(text).to.equal(`0 of ${ROWS} codes kept`);
    });

    cy.get('#btn-select-all button').click();
    cy.get('#kept-count').should($el => {
      const text = $el[0].shadowRoot?.getElementById('value')?.textContent?.trim();
      expect(text).to.equal(`${ROWS} of ${ROWS} codes kept`);
    });
  });

  it('a lazily-revealed row still reacts to a checkbox toggle', () => {
    cy.get('#r-rows > fx-repeatitem', { timeout: 20000 }).should('have.length', SIZE);

    cy.get('.row-list').scrollTo('bottom');
    cy.get('#r-rows > fx-repeatitem', { timeout: 5000 }).should('have.length', ROWS);

    cy.get('#r-rows > fx-repeatitem')
      .last()
      .find('.keep-col input[type="checkbox"]')
      .uncheck();

    cy.get('#kept-count').should($el => {
      const text = $el[0].shadowRoot?.getElementById('value')?.textContent?.trim();
      expect(text).to.equal(`${ROWS - 1} of ${ROWS} codes kept`);
    });
  });
});
