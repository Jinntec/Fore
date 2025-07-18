describe('on-demand.html', () => {
  beforeEach(() => {
    cy.visit('lab/on-demand.html');
  });

  it('creates menu of on-demand items and allows switching them visible"', () => {
    cy.get('#example1 [ref="greetings"]').should('be.visible');
    cy.get('#example1 [ref="empty"]').should('be.visible');
    cy.get('#example1 [ref="item1"]').should('not.be.visible');
    cy.get('#example1 [ref="item2"]').should('not.be.visible');

    // The next two are visible because they have content. even though they are on demand
    cy.get('#example1 [ref="ondemand"]').should('be.visible');
    cy.get('#example1 [ref="ondemand2"]').should('not.be.visible');

    cy.get('#menu').click();
    cy.get('#menu')
      .shadow()
      .find('a')
      .should('have.length', 2);

    cy.get('#menu')
      .shadow()
      .find('a:nth-child(1)')
      .click();

    cy.get('#example1 [ref="ondemand"]').should('be.visible');
    cy.get('#example1 [ref="ondemand2"]').should('be.visible');
    cy.get('#example1 [aria-label="section"]').should('not.be.visible');
  });

  it('allows switching them non-visible again"', () => {
    cy.get('#menu2').click();
    // click the first item and make control visible
    cy.get('#menu2')
      .shadow()
      .find('a:nth-child(1)')
      .click();

    cy.get('#example2 [ref="empty"]').should('be.visible');
    cy.get('#example2 [ref="ondemand"]').should('be.visible');
    cy.get('#example2 [ref="ondemand"] .trash').click();

    cy.get('#example2 [ref="ondemand"]').should('not.be.visible');

    cy.get('#menu2').click();
    cy.get('#menu2')
      .shadow()
      .find('a')
      .last()
      .should('have.text', 'On demand');
  });

  it('hides empty control in mode hide-on-empty, shows trash icon and allows hiding again"', () => {
    cy.get('#example2 [ref="greetings"]').should('be.visible');
    cy.get('#example2 [ref="empty"]').should('not.be.visible');
    cy.get('#example2 [ref="ondemand"]').should('be.visible');
    cy.get('#example2 [ref="ondemand2"]').should('be.visible');

    cy.get('#menu2').click();
    cy.get('#menu2')
      .shadow()
      .find('a')
      .should('have.length', 1);

    cy.get('#menu2')
      .shadow()
      .find('a:nth-child(1)')
      .should('have.text', 'empty value');
  });
});
