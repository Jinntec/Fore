describe('email embedding test', () => {
	beforeEach(() => {
		cy.visit('controls/email-test.html');
	});

	it('display value from parent"', () => {
		cy.get('input')
			.should('have.value', 'John');


	});

});
