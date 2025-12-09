describe('jinntap.html', () => {
  beforeEach(() => {
    cy.visit('jinntap.html');
  });

  it('can edit a document and responds to submissions', () => {
    cy.get('fx-fore.fx-ready jinn-tap tei-p').type('Hello World!');

    cy.get('pre').should('contain', '<TEI').should('contain', 'Hello World!');

    cy.get('fx-trigger button').click();

    cy.get('pre').should('contain', '<TEI').should('contain', 'This is another TEI document');
  });
});
