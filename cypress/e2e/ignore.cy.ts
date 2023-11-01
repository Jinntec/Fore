describe('while demo spec', () => {
   beforeEach(() => {
       cy.visit('ignore.html');
   });
  // @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
  it('should not ignore all expressions', () => {
    cy.get('fx-fore span')
		.should('contain', 'Hello')
  });

  it('should ignore expressions under the ignore filter', () => {
      cy.get('fx-fore .myElement span')
          .first()
          .should('contain', '{ignored}');
      cy.get('fx-fore .myElement span')
          .last()
          .should('contain', '{whatever}');
  });

  it('should also ignore expressions under the ignore filter that would cause errors', () => {
      cy.get('fx-fore .myElement')
          .last()
          .should('contain', '{}{}{{{}}}');
  });
});
