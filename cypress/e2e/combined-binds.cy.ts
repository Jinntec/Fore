// Several fx-binds on the same node: constraint/relevant need all to hold,
// required/readonly need only one (see demo/combined-binds.html).

function setSelect(id: string, value: string) {
  cy.get(`#${id} input`)[value === 'true' ? 'check' : 'uncheck']();
}

describe('combined binds', () => {
  beforeEach(() => {
    cy.visit('combined-binds.html');
    cy.get('fx-control#age').should('exist');
  });

  it('readonly if any of the readonly binds is true', () => {
    cy.get('#age input').should('not.have.attr', 'readonly');
    setSelect('locked', 'true');
    cy.get('#age input').should('have.attr', 'readonly');
  });

  it('readonly stays when only one of two readonly binds is switched off', () => {
    setSelect('locked', 'true');
    setSelect('frozen', 'true');
    setSelect('locked', 'false');
    cy.get('#age input').should('have.attr', 'readonly');
    setSelect('frozen', 'false');
    cy.get('#age input').should('not.have.attr', 'readonly');
  });

  it('required follows the OR of its binds and switches off again', () => {
    cy.get('#age').should('not.have.attr', 'required');
    setSelect('needed', 'true');
    cy.get('#age').should('have.attr', 'required');
    setSelect('wanted', 'true');
    setSelect('needed', 'false');
    cy.get('#age').should('have.attr', 'required');
    cy.get('#age input').should('have.attr', 'required');
    setSelect('wanted', 'false');
    cy.get('#age').should('not.have.attr', 'required');
    cy.get('#age input').should('not.have.attr', 'required');
  });

  it('is nonrelevant if any relevant bind is false', () => {
    cy.get('#age').should('not.have.attr', 'nonrelevant');
    setSelect('showb', 'false');
    cy.get('#age').should('have.attr', 'nonrelevant');
    setSelect('showb', 'true');
    cy.get('#age').should('not.have.attr', 'nonrelevant');
  });

  it('starts focused on Age without alerts and shows the alert on blur', () => {
    cy.get('#age input').should('have.focus');
    cy.get('#age').should('not.have.attr', 'invalid');
    cy.get('#age fx-alert').should('not.exist');
    cy.get('#age input').blur();
    cy.get('#age').should('have.attr', 'invalid');
    cy.get('#age fx-alert').should('have.length', 1).and('contain.text', '18 or older');
  });

  it('shows only the alert of the constraint that fails', () => {
    cy.get('#age input').clear().type('150').blur();
    cy.get('#age fx-alert').should('have.length', 1).and('contain.text', 'younger than 100');
    cy.get('#age input').clear().type('5').blur();
    cy.get('#age fx-alert').should('have.length', 1).and('contain.text', '18 or older');
  });

  it('is invalid if any constraint fails', () => {
    cy.get('#age input').clear().type('5').blur();
    cy.get('#age').should('have.attr', 'invalid');
    cy.get('#age input').clear().type('150').blur();
    cy.get('#age').should('have.attr', 'invalid');
    cy.get('#age input').clear().type('50').blur();
    cy.get('#age').should('not.have.attr', 'invalid');
  });
});
