describe('repeat-attributes-4.html', () => {
  beforeEach(() => {
    cy.visit('repeat-attributes-4.html');
  });

  it('binds a <ul data-ref="//field"> flat over every field in every item', () => {
    cy.get('fx-fore.fx-ready').click();

    // 3 items x 6 fields each = 18 <li> entries, flattened across the whole instance.
    cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 18);

    cy.get('fx-repeat-attributes .fx-repeatitem')
      .find('fx-output')
      .then($outs => {
        const values = Array.from($outs).map(
          (el: any) => el.getAttribute('value') ?? el.value ?? (el.textContent || '').trim(),
        );
        expect(values).to.deep.equal([
          'a', 'b', 'c', 'd', 'e', 'f',
          'g', 'h', 'i', 'j', 'k', 'l',
          'm', 'n', 'o', 'p', 'q', 'r',
        ]);
      });
  });
});
