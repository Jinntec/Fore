describe('on-demand.html', () => {
  beforeEach(() => {
    cy.visit('lab/on-demand.html');
  });

  it('creates menu of on-demand items and allows switching them visible"', () => {
    cy.get('#example1 [ref="greetings"]').should('be.visible');
    cy.get('#example1 [ref="empty"]').should('be.visible');
    cy.get('#example1 [ref="ondemand"]').should('not.be.visible');
    cy.get('#example1 [ref="ondemand2"]').should('not.be.visible');

    cy.get('#menu').click();
    cy.get('#menu')
      .shadow()
      .find('a')
      .should('have.length', 3);

    cy.get('#menu')
      .shadow()
      .find('a:nth-child(1)')
      .click();

    cy.get('#example1 [ref="ondemand"]').should('be.visible');
    cy.get('#example1 [ref="ondemand2"]').should('not.be.visible');

    cy.get('#menu').click();
    cy.get('#menu')
      .shadow()
      .find('a:nth-child(1)')
      .click();

    cy.get('#example1 [ref="ondemand"]').should('be.visible');
    cy.get('#example1 [ref="ondemand2"]').should('be.visible');

    cy.get('#menu').click();
    cy.get('#menu')
      .shadow()
      .find('a:nth-child(1)')
      .click();

    cy.get('#example1 [ref="ondemand"]').should('be.visible');
    cy.get('#example1 [ref="ondemand2"]').should('be.visible');
    cy.get('#example1 [aria-label="add section"]').should('be.visible');

    cy.get('#menu button').should('have.attr', 'disabled', 'disabled');
  });

  it('allows switching them non-visible again"', () => {
    cy.get('#menu2').click();
    // click the first item and make control visible
    cy.get('#menu2')
      .shadow()
      .find('a:nth-child(2)')
      .click();

    cy.get('#example2 [ref="empty"]').should('not.be.visible');
    cy.get('#example2 [ref="ondemand"]').should('be.visible');
    cy.get('#example2 [ref="ondemand"] .trash').click();

    cy.get('#example2 [ref="ondemand"]').should('not.be.visible');

    cy.get('#menu2').click();
    cy.get('#menu2')
      .shadow()
      .find('a:nth-child(2)')
      .should('have.text', 'On demand');
  });

  it('hides empty control in mode hide-on-empty, shows trash icon and allows hiding again"', () => {
    cy.get('#example2 [ref="greetings"]').should('be.visible');
    cy.get('#example2 [ref="empty"]').should('not.be.visible');
    cy.get('#example2 [ref="ondemand"]').should('not.be.visible');
    cy.get('#example2 [ref="ondemand2"]').should('not.be.visible');

    cy.get('#menu2').click();
    cy.get('#menu2')
      .shadow()
      .find('a')
      .should('have.length', 3);

    cy.get('#menu2')
      .shadow()
      .find('a:nth-child(1)')
      .click();

    cy.get('#example2 [ref="empty"] .trash').should('be.visible');

    cy.get('#example2 [ref="empty"]')
      .find('.trash')
      .click();

    cy.get('#example2 [ref="empty"]').should('not.be.visible');
  });
});
