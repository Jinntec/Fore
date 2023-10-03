describe('while demo spec', () => {
   beforeEach (() => {
       cy.visit('while.html');
   });
  // @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
  it('show the expecter header', () => {
    cy.get('h1 > code')
      .should('contain', 'while')
  })

  it('display notification at 10', () => {
    cy.get('[data-cy="counter"]')
      .click()
    cy.get('.toastify')
      .should('be.visible')
  })

  it('notify user 10 times', () => {
    cy.get('[data-cy="start"]')
      .click()
    cy.get('.toastify')
      .should('have.length', '10')
  })

  it.skip('start and abort', () => {
    cy.get('[data-cy="hey-go"]')
      .click()
    cy.get('.toastify')
      .should('have.length', '10')
  })

  it.skip('continue and abort on adding and removing', () => {
    cy.get('[data-cy="hey-go"]')
      .click()
    cy.get('.toastify')
      .should('have.length', '10')
  })
})
