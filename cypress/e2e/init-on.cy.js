/// <reference types="cypress" />

/**
 * Tests for demo/on-event.html
 *
 * These tests focus on init gating:
 * - init-on (self)
 * - init-on-target=document
 * - init-on=ready init-on-target=<selector>
 * - init-on-target list support
 * - deprecated wait-for still works (and warns)
 *
 * Notes:
 * - Many demo pages render inside <demo-snippet>, which uses shadow DOM.
 *   We enable includeShadowDom so selectors can reach into those trees.
 */

// Cypress.config('includeShadowDom', true);

describe('fx-fore init gating demos (demo/on-event.html)', () => {
  it('1) initializes on click (default target: self)', () => {
    cy.visit('on-event.html');

    // Before click, greeting should not be rendered yet (init is gated)
    cy.get('fx-fore#first fx-output', { includeShadowDom: true })
      .invoke('text')
      .should('not.include', 'Hello Earth');

    cy.get('fx-fore#first button', { includeShadowDom: true }).click();

    cy.get('fx-fore#first', { includeShadowDom: true }).should('contain.text', 'Hello Earth');
  });

  it('2) initializes when boot event is dispatched on document', () => {
    cy.visit('on-event.html');

    const gated = 'fx-fore[init-on="boot"][init-on-target="document"]';

    cy.get(`${gated} fx-output`, { includeShadowDom: true })
      .invoke('text')
      .should('not.include', 'Booted by document event');

    cy.contains('button', 'Dispatch').click();

    cy.get(`${gated}`, { includeShadowDom: true }).should(
      'contain.text',
      'Booted by document event',
    );
  });

  it('3) initializes when another fx-fore fires ready (replacement for wait-for)', () => {
    cy.visit('on-event.html');

    cy.get('fx-fore#master-fore', { includeShadowDom: true }).should(
      'contain.text',
      'Master is ready.',
    );

    cy.get('fx-fore[init-on="ready"][init-on-target="#master-fore"]', {
      includeShadowDom: true,
    }).should('contain.text', 'Dependent initialized after master ready.');
  });

  it('4) supports multiple init-on-target selectors (whitespace list)', () => {
    cy.visit('on-event.html');

    cy.get('fx-fore#dep-a', { includeShadowDom: true }).should('contain.text', 'A ready.');
    cy.get('fx-fore#dep-b', { includeShadowDom: true }).should('contain.text', 'B ready.');

    cy.get('fx-fore[init-on="ready"][init-on-target="#dep-a #dep-b"]', {
      includeShadowDom: true,
    }).should('contain.text', 'Initialized after A and B were ready.');
  });

  it('deprecated wait-for still works and emits a deprecation warning', () => {
    cy.on('window:before:load', win => {
      cy.spy(win.console, 'warn').as('consoleWarn');
    });

    cy.visit('on-event.html');

    // Legacy dependent should still initialize
    cy.get('fx-fore[wait-for="#legacy-master"]', { includeShadowDom: true }).should(
      'contain.text',
      'Legacy dependent initialized after master ready.',
    );

    // Warning should be printed at least once
    cy.get('@consoleWarn').should('have.been.called');
    cy.get('@consoleWarn')
      .its('firstCall.args.0')
      .should('match', /wait-for.+deprecated/i);
  });
});
