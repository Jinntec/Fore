function outputValues(row: JQuery<HTMLElement>) {
  return Array.from(row.find('fx-output')).map(
    (el: any) => el.getAttribute('value') ?? el.value ?? (el.textContent || '').trim(),
  );
}

describe('repeat-attributes-1.html', () => {
  beforeEach(() => {
    cy.visit('repeat-attributes-1.html');
  });

  it('binds a <table data-ref> to the item nodeset', () => {
    cy.get('fx-fore.fx-ready').click();

    cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 3);

    cy.get('fx-repeat-attributes .fx-repeatitem')
      .eq(0)
      .then($row => {
        expect(outputValues($row)).to.deep.equal(['a', 'b', 'c', 'd', 'e', 'f']);
      });

    cy.get('fx-repeat-attributes .fx-repeatitem')
      .eq(2)
      .then($row => {
        expect(outputValues($row)).to.deep.equal(['m', 'n', 'o', 'p', 'q', 'r']);
      });
  });
});
