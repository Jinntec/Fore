describe('repeat-attributes-7.html', () => {
  beforeEach(() => {
    cy.visit('repeat-attributes-7.html');
  });

  it('binds <tbody data-ref> while a static <thead> outside the repeat stays untouched', () => {
    cy.get('fx-fore.fx-ready').click();

    cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 3);

    cy.get('fx-repeat-attributes .fx-repeatitem')
      .eq(0)
      .find('td')
      .then($tds => {
        const texts = Array.from($tds).map(td => td.textContent?.trim());
        expect(texts).to.deep.equal(['a', 'b', 'c', 'd', 'e', 'f']);
      });

    // data-ref lives on <tbody>, not the whole <table> - the <thead> above it is plain
    // static markup and must not be affected by the repeat.
    cy.get('thead th').then($ths => {
      const texts = Array.from($ths).map(th => th.textContent?.trim());
      expect(texts).to.deep.equal(['A', 'B', 'C', 'D', 'E', 'F']);
    });
  });
});
