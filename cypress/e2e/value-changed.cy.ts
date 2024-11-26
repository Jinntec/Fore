describe('value-changed event firing', () => {
  beforeEach(() => {
    cy.visit('value-changed.html');
  });

  it('triggers the correct events with the correct data for the default instance', () => {
    cy.get('[data-cy=relative-path] input').type(' Test1!').blur();
    cy.get('.toastify').should(
      'contain',
      `instance('default') in $default/greetings[1]/greeting-a[1] changed from Hello World! to Hello World! Test1!`,
    );

    cy.get('[data-cy=implicit-default-instance] input').type(' Test2!').blur();
    cy.get('.toastify').should(
      'contain',
      `instance('default') in $default/greetings[1]/greeting-b[1] changed from Hello World! to Hello World! Test2!`,
    );

    cy.get('[data-cy=variable-default-instance] input').type(' Test3!').blur();
    cy.get('.toastify').should(
      'contain',
      `instance('default') in $default/greetings[1]/greeting-b[1] changed from Hello World! to Hello World! Test2!`,
    );
  });

  it('triggers the correct events with the correct data for the second instance', () => {
    cy.get('[data-cy=explicit-second-instance] input').type(' Test1!').blur();
    cy.get('.toastify').should(
      'contain',
      `instance('second') in $second/greetings[1]/greeting-a[1] changed from GoodBye to GoodBye Test1!`,
    );

    cy.get('[data-cy=variable-second-instance] input').type(' Test2!').blur();
    cy.get('.toastify').should(
      'contain',
      `instance('second') in $second/greetings[1]/greeting-b[1] changed from GoodBye to GoodBye Test2!`,
    );
  });
});
