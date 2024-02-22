describe('switch demo specc', () => {
    beforeEach(() => {
        cy.visit('switch.html');
    });
    // @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
    it('should display two switches', () => {
        cy.get('fx-switch')
            .should('have.length',2)
    });

    it('should display two messages - one for each', () => {
        cy.get('.toastify')
            .should('have.length',2)

    });

    it('should display first case', () => {
        cy.get('fx-case:nth-child(1)')
            .should('contain','some exclusive content')

    });

    it('should display second case', () => {
        cy.get('#page2btn').click()

        cy.get('fx-case:nth-child(2)')
            .should('contain','some further content')

    });

    it('should display third case', () => {
        cy.get('#page3btn').click()

        cy.get('fx-case:nth-child(3)')
            .should('contain','some completely unneeded content')
        cy.get('fx-case:nth-child(3) fx-control')
            .should('have.value','a bound item')

    });











});
