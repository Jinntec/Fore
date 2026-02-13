// cypress/e2e/json-movies-filtering.cy.ts

const DEMO_URL = 'json/json-movies-explorer.html';
const FORE_SEL = 'fx-fore#movies-demo';
const QUERY_INPUT_SEL = "fx-control[ref=\"instance('data')?ui?query\"] input.widget";

function movieItems() {
  return cy.get('fx-repeat#movies > fx-repeatitem');
}

function movieTitleOutputs() {
  return cy.get('fx-repeat#movies > fx-repeatitem fx-output[ref="?title"]');
}

function setQuery(query: string) {
  // Use invoke/trigger instead of .type() to keep it robust with custom input wiring.
  // Fore listens to the native 'input' event.
  return cy.get(QUERY_INPUT_SEL).should('exist').then($el => {
    const input = $el[0] as HTMLInputElement;
    input.value = query;
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  });
}

function readFxOutputValues(selector: Cypress.Chainable<JQuery<HTMLElement>>) {
  return selector.then($els => {
    return Array.from($els).map(el => {
      const anyEl = el as any;
      const v = anyEl.value;
      return (v !== undefined && v !== null ? String(v) : (el.textContent || '')).trim();
    });
  });
}

describe('JSON movies explorer filtering', () => {
  beforeEach(() => {
    cy.visit(DEMO_URL);
    cy.get(`${FORE_SEL}.fx-ready`).should('exist');
    cy.get('fx-repeat#movies').should('exist');
  });

  it('shows many rows initially', () => {
    movieItems().should('have.length.greaterThan', 5);
  });

  it('filters down to Blade Runner when query is "Blade"', () => {
    setQuery('Blade');

    // Cypress retries until the DOM matches.
    movieItems().should('have.length', 1);

    readFxOutputValues(movieTitleOutputs()).then(titles => {
      expect(titles).to.deep.equal(['Blade Runner']);
    });
  });

  it('updates when query changes multiple times', () => {
    setQuery('Matrix');
    movieItems().should('have.length', 1);
    readFxOutputValues(movieTitleOutputs()).then(titles => {
      expect(titles[0]).to.equal('The Matrix');
    });

    setQuery('Alien');
    movieItems().should('have.length', 1);
    readFxOutputValues(movieTitleOutputs()).then(titles => {
      expect(titles[0]).to.equal('Alien');
    });

    setQuery('');
    movieItems().should('have.length.greaterThan', 5);
  });
});