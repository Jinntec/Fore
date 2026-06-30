/// <reference types="cypress" />

/**
 * Native browser validation integration tests.
 *
 * Covers the CSS-driven feedback layer that cannot be tested in unit tests:
 * - :user-valid / :user-invalid only activate after real user interaction
 * - fx-alert visibility is driven by :has(input:user-invalid)
 * - input border colours change only after blur
 *
 * Requires: npm start (dev server on port 8090)
 */

const PAGE = 'native-validation.html';

function waitForReady() {
  cy.get('fx-fore.fx-ready', { timeout: 10000 }).should('exist');
}

describe('native-validation demo', () => {
  beforeEach(() => {
    cy.visit(PAGE);
    waitForReady();
  });

  // ── Initial load ──────────────────────────────────────────────────────────
  describe('initial load — no premature feedback', () => {
    it('shows no fx-alert on any field', () => {
      cy.get('fx-alert').each($alert => {
        cy.wrap($alert).should('not.be.visible');
      });
    });

    it('shows no red border on any input', () => {
      // Fore only sets [invalid] on controls after ready; the CSS suppresses
      // border feedback until :user-invalid fires. Verify no input has a red border
      // by asserting borders match the neutral #ccc colour.
      cy.get('fx-control input.widget').each($input => {
        cy.wrap($input).should('have.css', 'border-color', 'rgb(204, 204, 204)');
      });
    });
  });

  // ── Age — min/max ─────────────────────────────────────────────────────────
  describe('age field (type=number min=0 max=120)', () => {
    it('marks invalid and shows alert when value exceeds max', () => {
      cy.get('#ctrl-age input.widget').type('200').blur();
      cy.get('#ctrl-age').should('have.attr', 'invalid');
      cy.get('#ctrl-age fx-alert').should('be.visible');
    });

    it('marks valid and hides alert when value is in range', () => {
      // First go invalid so there is a state transition to observe
      cy.get('#ctrl-age input.widget').type('200').blur();
      cy.get('#ctrl-age').should('have.attr', 'invalid');

      cy.get('#ctrl-age input.widget').clear().type('25').blur();
      cy.get('#ctrl-age').should('not.have.attr', 'invalid');
      cy.get('#ctrl-age fx-alert').should('not.be.visible');
    });

    it('marks invalid when value is below min', () => {
      cy.get('#ctrl-age input.widget').type('-5').blur();
      cy.get('#ctrl-age').should('have.attr', 'invalid');
      cy.get('#ctrl-age fx-alert').should('be.visible');
    });
  });

  // ── Email — type=email ────────────────────────────────────────────────────
  describe('email field (type=email, required)', () => {
    it('marks invalid and shows alert for malformed email', () => {
      cy.get('#ctrl-email input.widget').type('notanemail').blur();
      cy.get('#ctrl-email').should('have.attr', 'invalid');
      cy.get('#ctrl-email fx-alert').should('be.visible');
    });

    it('marks valid and hides alert for well-formed email', () => {
      cy.get('#ctrl-email input.widget').type('notanemail').blur();
      cy.get('#ctrl-email').should('have.attr', 'invalid');

      cy.get('#ctrl-email input.widget').clear().type('user@example.com').blur();
      cy.get('#ctrl-email').should('not.have.attr', 'invalid');
      cy.get('#ctrl-email fx-alert').should('not.be.visible');
    });
  });

  // ── Zipcode — pattern ─────────────────────────────────────────────────────
  // Pattern uses [0-9][0-9][0-9][0-9][0-9] (not [0-9]{5}) — Fore's template-
  // expression engine rewrites {...} in HTML attributes as XPath expressions.
  describe('zipcode field (5-digit pattern)', () => {
    it('marks invalid and shows alert when pattern does not match', () => {
      cy.get('#ctrl-zipcode input.widget').type('abc').blur();
      cy.get('#ctrl-zipcode').should('have.attr', 'invalid');
      cy.get('#ctrl-zipcode fx-alert').should('be.visible');
    });

    it('marks valid when pattern matches', () => {
      cy.get('#ctrl-zipcode input.widget').type('abc').blur();
      cy.get('#ctrl-zipcode').should('have.attr', 'invalid');

      cy.get('#ctrl-zipcode input.widget').clear().type('12345').blur();
      cy.get('#ctrl-zipcode').should('not.have.attr', 'invalid');
      cy.get('#ctrl-zipcode fx-alert').should('not.be.visible');
    });

    it('does not mark invalid when empty (field is optional)', () => {
      // An empty optional pattern field is valid per the HTML spec
      cy.get('#ctrl-zipcode input.widget').focus().blur();
      cy.get('#ctrl-zipcode').should('not.have.attr', 'invalid');
    });
  });

  // ── Price — step mismatch ─────────────────────────────────────────────────
  describe('price field (type=number min=0.01 step=0.01)', () => {
    it('marks invalid for a value with too many decimal places', () => {
      cy.get('#ctrl-price input.widget').type('9.999').blur();
      cy.get('#ctrl-price').should('have.attr', 'invalid');
      cy.get('#ctrl-price fx-alert').should('be.visible');
    });

    it('marks invalid when below minimum', () => {
      cy.get('#ctrl-price input.widget').type('0').blur();
      cy.get('#ctrl-price').should('have.attr', 'invalid');
    });

    it('marks valid for a correctly formatted price', () => {
      cy.get('#ctrl-price input.widget').type('9.999').blur();
      cy.get('#ctrl-price').should('have.attr', 'invalid');

      cy.get('#ctrl-price input.widget').clear().type('9.99').blur();
      cy.get('#ctrl-price').should('not.have.attr', 'invalid');
      cy.get('#ctrl-price fx-alert').should('not.be.visible');
    });
  });

  // ── Username — minlength/maxlength ───────────────────────────────────────
  describe('username field (minlength=3 maxlength=20)', () => {
    it('marks invalid and shows alert when value is too short', () => {
      cy.get('#ctrl-username input.widget').type('ab').blur();
      cy.get('#ctrl-username').should('have.attr', 'invalid');
      cy.get('#ctrl-username fx-alert').should('be.visible');
    });

    it('marks valid when value meets minlength', () => {
      cy.get('#ctrl-username input.widget').type('ab').blur();
      cy.get('#ctrl-username').should('have.attr', 'invalid');

      cy.get('#ctrl-username input.widget').clear().type('abc').blur();
      cy.get('#ctrl-username').should('not.have.attr', 'invalid');
      cy.get('#ctrl-username fx-alert').should('not.be.visible');
    });

    it('does not mark invalid when empty (minlength does not imply required)', () => {
      cy.get('#ctrl-username input.widget').focus().blur();
      cy.get('#ctrl-username').should('not.have.attr', 'invalid');
    });
  });

  // ── aria-invalid ──────────────────────────────────────────────────────────
  describe('aria-invalid on widget', () => {
    it('sets aria-invalid=true on the inner input when native validation fails', () => {
      cy.get('#ctrl-age input.widget').type('200').blur();
      cy.get('#ctrl-age input.widget').should('have.attr', 'aria-invalid', 'true');
    });

    it('sets aria-invalid=false when native validation passes', () => {
      cy.get('#ctrl-age input.widget').type('200').blur();
      cy.get('#ctrl-age input.widget').clear().type('25').blur();
      cy.get('#ctrl-age input.widget').should('have.attr', 'aria-invalid', 'false');
    });
  });
});