describe('repeat-attributes-2.html', () => {
  beforeEach(() => {
    cy.visit('repeat-attributes-2.html');
  });

  it('repeats <td> elements within a single row from item[3]/field', () => {
    cy.get('fx-fore.fx-ready').click();

    // The repeated unit here is the <td> itself, not the <tr> - the data-ref
    // ("item[3]/field") is on the <tr>, and each field of item 3 becomes one cell.
    cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 6);
    cy.get('fx-repeat-attributes .fx-repeatitem').each($cell => {
      expect($cell.prop('tagName')).to.equal('TD');
    });

    cy.get('fx-repeat-attributes .fx-repeatitem')
      .find('fx-output')
      .then($outs => {
        const values = Array.from($outs).map(
          (el: any) => el.getAttribute('value') ?? el.value ?? (el.textContent || '').trim(),
        );
        expect(values).to.deep.equal(['a', 'b', 'c', 'd', 'e', 'f']);
      });
  });
});
