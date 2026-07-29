function cellTexts(row: JQuery<HTMLElement>) {
  return Array.from(row.find('td')).map(td => td.textContent?.trim());
}

describe('repeat-attributes-6.html', () => {
  beforeEach(() => {
    cy.visit('repeat-attributes-6.html');
  });

  it('renders template expressions ({field[@name=...]}) inside a data-ref table, no fx-output', () => {
    cy.get('fx-fore.fx-ready').click();

    cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 3);

    cy.get('fx-repeat-attributes .fx-repeatitem')
      .eq(0)
      .then($row => {
        expect(cellTexts($row)).to.deep.equal(['a', 'b', 'c', 'd', 'e', 'f']);
      });

    cy.get('fx-repeat-attributes .fx-repeatitem')
      .eq(2)
      .then($row => {
        expect(cellTexts($row)).to.deep.equal(['m', 'n', 'o', 'p', 'q', 'r']);
      });
  });
});
