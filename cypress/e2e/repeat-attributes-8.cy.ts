function cellValues(row: JQuery<HTMLElement>) {
  return Array.from(row.find('td > fx-output')).map(
    (el: any) => el.getAttribute('value') ?? el.value ?? (el.textContent || '').trim(),
  );
}

describe('repeat-attributes-8.html', () => {
  beforeEach(() => {
    cy.visit('repeat-attributes-8.html');
  });

  it('renders a plain nested <fx-repeat> inside a data-ref row (the current workaround for nesting)', () => {
    cy.get('fx-fore.fx-ready').click();

    cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 3);

    cy.get('fx-repeat-attributes .fx-repeatitem')
      .eq(0)
      .find('fx-repeat span')
      .then($spans => {
        const texts = Array.from($spans).map(s => s.textContent?.trim());
        expect(texts).to.deep.equal(['a', 'b', 'c', 'd', 'e', 'f']);
      });

    cy.get('fx-repeat-attributes .fx-repeatitem')
      .eq(0)
      .then($row => {
        expect(cellValues($row)).to.deep.equal(['a', 'b', 'c', 'd', 'e', 'f']);
      });
  });

  it('deletes a row via the per-row trigger, leaving the other rows intact', () => {
    cy.get('fx-fore.fx-ready').click();

    cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 3);

    cy.get('fx-repeat-attributes .fx-repeatitem').eq(0).contains('button', 'del').click();

    cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 2);

    cy.get('fx-repeat-attributes .fx-repeatitem')
      .eq(0)
      .then($row => {
        expect(cellValues($row)).to.deep.equal(['g', 'h', 'i', 'j', 'k', 'l']);
      });
  });
});
