describe('on-demand.html', () => {
  beforeEach(() => {
    cy.visit('lab/on-demand.html');
  });

  it('creates menu of on-demand items and allows switching them visible"', () => {
    cy.get('[ref="greetings"]').should('be.visible');
    cy.get('[ref="ondemand"]').should('not.be.visible');
    cy.get('[ref="ondemand2"]').should('not.be.visible');

    cy.get('fx-control-menu').click();
    cy.get('fx-control-menu')
      .shadow()
      .find('a')
      .should('have.length', 2);

    cy.get('fx-control-menu')
      .shadow()
      .find('a:nth-child(1)')
      .click();

    cy.get('[ref="ondemand"]').should('be.visible');
    cy.get('[ref="ondemand2"]').should('not.be.visible');

    cy.get('fx-control-menu').click();
    cy.get('fx-control-menu')
      .shadow()
      .find('a:nth-child(1)')
      .click();

    cy.get('[ref="ondemand"]').should('be.visible');
    cy.get('[ref="ondemand2"]').should('be.visible');

    cy.get('fx-control-menu button').should('have.attr', 'disabled', 'disabled');
  });

  it('allows switching them non-visible again"', () => {
    cy.get('fx-control-menu').click();
    // click the first item and make control visible
    cy.get('fx-control-menu')
      .shadow()
      .find('a:nth-child(1)')
      .click();

    cy.get('[ref="ondemand"]').should('be.visible');
    cy.get('[ref="ondemand"]')
      .shadow()
      .find('.trash')
      .click();

    cy.get('[ref="ondemand"]').should('not.be.visible');

    cy.get('fx-control-menu').click();
    cy.get('fx-control-menu')
      .shadow()
      .find('a:nth-child(1)')
      .should('have.text', 'On demand');
  });
});
