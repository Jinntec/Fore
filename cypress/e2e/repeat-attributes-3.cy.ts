describe('repeat-attributes-3.html', () => {
	beforeEach(() => {
		cy.visit('repeat-attributes-3.html');
	});

	it('repeatitem-3 tests"', () => {
		// wait until fore is fully ready
		cy.get('fx-fore.fx-ready').click();

		// initial number of rendered items
		cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 3);

		// perform the append (keeps values from the last item m..r)
		cy.contains('button', 'append').click();


		// should now have one more item
		cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 4);

		// container exposes 1-based index and should still be 1 (first row selected)
		cy.get('fx-repeat-attributes').should('have.attr', 'index', '4');
		cy.get('fx-repeat-attributes .fx-repeatitem').eq(3).should('have.attr', 'repeat-index');

		// assert the newly appended (last) row has cells m,n,o,p,q,r
		const expected = ['m','n','o','p','q','r'];

		cy.get('fx-repeat-attributes .fx-repeatitem')
			.eq(3) // 0-based index → 4th row
			.find('fx-output')
			.then(($outs) => {
				const values = Array.from($outs).slice(0, 6).map((el: any) => {
					return el.getAttribute('value') ?? el.value ?? (el.textContent || '').trim();
				});
				expect(values).to.deep.equal(expected);
			});
	});

	it('delete second → leaves 2 rows and leave index at 1', () => {
		// ensure fore is ready
		cy.get('fx-fore.fx-ready').click();

		// initially 3 rows
		cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 3);

		// click the 'delete second' trigger
		cy.contains('button', 'delete second').click();

		// should now have only 2 rows
		cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 2);

		// container exposes 1-based index and should still be 1 (first row selected)
		cy.get('fx-repeat-attributes').should('have.attr', 'index', '1');

		// and the current repeat index marker should be on the 1st row
		cy.get('fx-repeat-attributes .fx-repeatitem').eq(0).should('have.attr', 'repeat-index');
	});

	it('insert an empty row', () => {
		cy.get('fx-fore.fx-ready').click();
		cy.contains('button', 'insert before second').click();
		cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 4);
		cy.get('fx-repeat-attributes').should('have.attr', 'index', '2');

		cy.get('fx-repeat-attributes .fx-repeatitem').eq(1).should('have.attr', 'repeat-index');

		cy.get('fx-repeat-attributes fx-output').should('have.text', '');
	});

	it('insert a row after second', () => {
		cy.get('fx-fore.fx-ready').click();
		cy.contains('button', 'insert after second with values').click();
		cy.get('fx-repeat-attributes .fx-repeatitem').should('have.length', 4);
		cy.get('fx-repeat-attributes').should('have.attr', 'index', '3');
		cy.get('fx-repeat-attributes .fx-repeatitem').eq(2).should('have.attr', 'repeat-index');

		const expected = ['m','n','o','p','q','r'];

		cy.get('fx-repeat-attributes .fx-repeatitem')
			.eq(3) // 0-based index → 4th row
			.find('fx-output')
			.then(($outs) => {
				const values = Array.from($outs).slice(0, 6).map((el: any) => {
					return el.getAttribute('value') ?? el.value ?? (el.textContent || '').trim();
				});
				expect(values).to.deep.equal(expected);
			});

	});


});