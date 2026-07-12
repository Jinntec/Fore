// cypress/e2e/repeat-virtual-windowing.cy.ts
//
// Covers fx-repeat's true windowed virtualization (`size` + `virtual`, Phase 2 of the repeat
// virtualization roadmap, see .claude/plans/fore-repeat-virtualization.md), using the extended
// demo/perf/large-repeat.html demo: a 1000-row XML instance with `size="50" virtual"` and a
// bounded `.scroll-container` wrapper. Unlike Phase 1's `size`-only progressive rendering
// (cypress/e2e/repeat-progressive-rendering.cy.ts), the DOM here stays bounded at ~`size` rows
// regardless of how far the user scrolls - rows are evicted, not just appended.

const DEMO_URL = 'perf/large-repeat.html';
const TOTAL = 1000;
const SIZE = 50;
// Generous bound: eviction only removes rows confirmed a safety margin past the fold, so the
// rendered count can transiently sit a bit above `size` - it must never approach the full
// dataset, which is the actual property being verified here.
const MAX_REASONABLE_RENDERED = SIZE * 3;

function repeatItems() {
  return cy.get('.scroll-container fx-repeatitem');
}

function scrollToBottomUntilStable(times = 15) {
  for (let i = 0; i < times; i += 1) {
    cy.get('.scroll-container').then($el => {
      $el[0].scrollTop = $el[0].scrollHeight;
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(200);
  }
}

function scrollToTopUntilStable(times = 15) {
  for (let i = 0; i < times; i += 1) {
    cy.get('.scroll-container').then($el => {
      $el[0].scrollTop = 0;
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(200);
  }
}

describe('fx-repeat true windowed virtualization (size + virtual)', () => {
  beforeEach(() => {
    cy.visit(DEMO_URL);
    cy.get('.scroll-container fx-repeatitem', { timeout: 20000 }).should('have.length', SIZE);
  });

  it('initially renders exactly `size` rows, keeping the full nodeset logically', () => {
    repeatItems().should('have.length', SIZE);
    cy.get('fx-repeat').should($el => {
      expect(($el[0] as any).nodeset.length).to.equal(TOTAL);
      expect(($el[0] as any)._windowStart).to.equal(0);
    });
  });

  it('scrolling to the bottom slides the window forward and keeps the DOM bounded', () => {
    scrollToBottomUntilStable();

    cy.get('fx-repeat').should($el => {
      expect(($el[0] as any)._windowStart).to.be.greaterThan(0);
    });
    repeatItems().its('length').should('be.lte', MAX_REASONABLE_RENDERED);
  });

  it('scrolling back to the top slides the window back down toward windowStart=0', () => {
    scrollToBottomUntilStable();
    cy.get('fx-repeat').should($el => expect(($el[0] as any)._windowStart).to.be.greaterThan(0));

    scrollToTopUntilStable();

    cy.get('fx-repeat').should($el => {
      expect(($el[0] as any)._windowStart).to.equal(0);
    });
    repeatItems().its('length').should('be.lte', MAX_REASONABLE_RENDERED);
  });

  it('never renders anywhere close to the full 1000-row dataset while scrolling', () => {
    scrollToBottomUntilStable();
    repeatItems()
      .its('length')
      .should('be.lessThan', TOTAL / 4);
  });

  it('setIndex() to a far-away index performs a hard jump and keeps the DOM at `size`', () => {
    cy.get('fx-repeat').then($el => {
      ($el[0] as any).setIndex(700);
    });

    cy.get('fx-repeat').should($el => {
      expect(($el[0] as any).index).to.equal(700);
      expect(($el[0] as any)._windowStart).to.equal(699);
    });
    repeatItems().should('have.length', SIZE);
    cy.get('.scroll-container').should($el => {
      expect(($el[0] as HTMLElement).scrollTop).to.equal(0);
    });
  });
});
