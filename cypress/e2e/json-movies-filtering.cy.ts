// cypress/e2e/json-movies-filtering.cy.ts

const DEMO_URL = 'json/json-movies-explorer.html';
const FORE_SEL = 'fx-fore#movies-demo';
const QUERY_INPUT_SEL = `fx-control[ref="instance('data')?ui?query"] input.widget`;

// IMPORTANT: filtering is implemented via binds setting nonrelevant + CSS hiding.
// So "filtered" == items that are NOT [nonrelevant].
function visibleMovieItems() {
  return cy.get('fx-repeat#movies > fx-repeatitem:not([nonrelevant])');
}

function visibleMovieTitleOutputs() {
  return cy.get('fx-repeat#movies > fx-repeatitem:not([nonrelevant]) fx-output[ref="?title"]');
}

function setQuery(query: string) {
  // Wait for Fore to finish its refresh cycle after changing the query.
  return cy.get(FORE_SEL).then($fore => {
    const fore = $fore[0] as HTMLElement;

    return cy.get(QUERY_INPUT_SEL).should('exist').then($el => {
      const input = $el[0] as HTMLInputElement;

      return new Cypress.Promise<void>(resolve => {
        // Attach listener BEFORE dispatching the input event to avoid missing it.
        fore.addEventListener('refresh-done', () => resolve(), { once: true });

        input.value = query;
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      });
    });
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
    visibleMovieItems().should('have.length.greaterThan', 5);
  });

  it('filters down to Blade Runner when query is "Blade"', () => {
    setQuery('Blade');

    // Cypress retries until the selection matches.
    visibleMovieItems().should('have.length', 1);

    readFxOutputValues(visibleMovieTitleOutputs()).then(titles => {
      expect(titles).to.deep.equal(['Blade Runner']);
    });
  });

  it('updates when query changes multiple times', () => {
    setQuery('Matrix');
    visibleMovieItems().should('have.length', 1);
    readFxOutputValues(visibleMovieTitleOutputs()).then(titles => {
      expect(titles[0]).to.equal('The Matrix');
    });

    setQuery('Alien');
    visibleMovieItems().should('have.length', 1);
    readFxOutputValues(visibleMovieTitleOutputs()).then(titles => {
      expect(titles[0]).to.equal('Alien');
    });

    setQuery('');
    visibleMovieItems().should('have.length.greaterThan', 5);
  });
});