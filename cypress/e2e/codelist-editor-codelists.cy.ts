// cypress/e2e/codelist-editor-codelists.cy.ts
//
// Smoke-tests demo/codelists/codelist-editor.html against a representative set of codelists: load,
// column headers, filter (the fx-bind[relevant] over Row, which reads instance('vars') and
// unprefixed codelist steps in one expression), and the per-row Edit dialog.
// Row/column counts are those of the files in demo/codelists/data/codelists/xml.
// Also guards that editing in the dialog never toggles Keep (the dialog sits inside .row).

const DEMO_URL = 'codelists/codelist-editor.html';

// Representative subset rather than every list: widest (6 columns), narrowest (2), one whose
// optional column is absent on some rows (EAS "remark" - exercises normalize-columns) and a
// 4-column one with an optional column.
const CODELISTS: { file: string; rows: number; cols: number }[] = [
  { file: 'Country-Codes-7.xml', rows: 250, cols: 6 },
  { file: 'Currency-Codes-3.xml', rows: 179, cols: 2 },
  { file: 'EAS-4.xml', rows: 94, cols: 3 },
  { file: 'VATEX-2019-12-11T08_43Z-yAZ.xml', rows: 56, cols: 4 },
];

// fx-output renders into its own shadow DOM (#value), so read it from there
const shadowText = ($el: JQuery<HTMLElement>) =>
  $el[0].shadowRoot?.getElementById('value')?.textContent?.trim() ?? '';

function expectKeptCount(kept: number, total: number) {
  cy.get('#kept-count').should($el => {
    expect(shadowText($el)).to.equal(`${kept} of ${total} codes kept`);
  });
}

// #r-rows renders progressively (size="20") and its items stay in the DOM when nonrelevant,
// so only relevant ones are "visible" rows
const visibleRows = () => cy.get('#r-rows > fx-repeatitem:not([nonrelevant])');

function loadCodelist(file: string, rows: number) {
  cy.visit(DEMO_URL);
  cy.get('#file-select').select(file);
  // the load flow locks the UI until the submission + post-processing have finished
  cy.get('main#editor-main', { timeout: 30000 }).should('not.have.class', 'ui-locked');
  expectKeptCount(rows, rows);
}

function setFilter(text: string) {
  cy.get('#filter-input').clear();
  if (text) cy.get('#filter-input').type(text);
}

describe('codelist editor: representative codelists', () => {
  CODELISTS.forEach(({ file, rows, cols }) => {
    describe(file, () => {
      beforeEach(() => loadCodelist(file, rows));

      it('loads all rows with all columns', () => {
        cy.get('#r-columns > fx-repeatitem').should('have.length', cols);
        // first row: every declared column gets a cell (normalize-columns fills gaps)
        visibleRows().first().find('.col-value').should('have.length', cols);
        visibleRows().first().find('.keep-col input[type="checkbox"]').should('be.checked');
        cy.get('.meta-panel fx-output').first().should($el => {
          expect(shadowText($el)).not.to.equal('');
        });
      });

      it('filters rows and restores them when the filter is cleared', () => {
        // nothing can match this
        setFilter('zzzqqq');
        visibleRows().should('have.length', 0);
        // rows stay in the data, the count is unaffected by filtering
        expectKeptCount(rows, rows);

        // filter by the first row's first cell: that row must remain
        setFilter('');
        visibleRows().first().find('.col-value fx-output').first().then($out => {
          const key = shadowText($out);
          expect(key, 'first cell value').not.to.equal('');
          setFilter(key);
          visibleRows().should('have.length.at.least', 1);
        });

        setFilter('');
        cy.get('#r-rows > fx-repeatitem[nonrelevant]').should('have.length', 0);
      });

      it('opens the Edit dialog for a row with one field per column', () => {
        visibleRows().first().find('.btn-edit-row button').click();
        visibleRows()
          .first()
          .find('dialog.edit-row-dialog')
          .should('have.attr', 'open')
          .then(() => {
            visibleRows()
              .first()
              .find('dialog.edit-row-dialog .field-row')
              .should('have.length', cols);
          });
        visibleRows().first().find('dialog.edit-row-dialog .dialog-actions button').click();
        visibleRows().first().find('dialog.edit-row-dialog').should('not.have.attr', 'open');
      });
    });
  });
});

describe('codelist editor: Edit dialog', () => {
  const { file, rows } = CODELISTS[1]; // Currency Codes: 2 columns, key + name

  beforeEach(() => loadCodelist(file, rows));

  it('edits a non-key value and shows it in the row after closing', () => {
    visibleRows().first().find('.btn-edit-row button').click();
    visibleRows().first().find('dialog.edit-row-dialog textarea').as('field');
    cy.get('@field').clear();
    cy.get('@field').type('Edited name').blur();
    visibleRows().first().find('dialog.edit-row-dialog .dialog-actions button').click();

    visibleRows()
      .first()
      .find('.col-value fx-output')
      .should($outs => {
        const texts = [...$outs].map(o => o.shadowRoot?.getElementById('value')?.textContent?.trim());
        expect(texts).to.include('Edited name');
      });
    // editing does not touch keep state
    expectKeptCount(rows, rows);
  });

  it('edits the key value and the dialog heading follows', () => {
    visibleRows().first().find('.btn-edit-row button').click();
    visibleRows().first().find('dialog.edit-row-dialog .field-row input').first().as('key');
    cy.get('@key').clear();
    cy.get('@key').type('XXX').blur();
    visibleRows()
      .first()
      .find('dialog.edit-row-dialog h2 fx-output')
      .should($el => expect(shadowText($el)).to.equal('XXX'));
  });

  it('edited values survive filtering (row stays bound to the same data)', () => {
    visibleRows().first().find('.btn-edit-row button').click();
    visibleRows().first().find('dialog.edit-row-dialog textarea').as('field');
    cy.get('@field').clear();
    cy.get('@field').type('Zebra unique').blur();
    visibleRows().first().find('dialog.edit-row-dialog .dialog-actions button').click();

    setFilter('zebra unique');
    visibleRows().should('have.length', 1);
    setFilter('');
    cy.get('#r-rows > fx-repeatitem[nonrelevant]').should('have.length', 0);
  });
});
