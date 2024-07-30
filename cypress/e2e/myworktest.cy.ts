describe('mywork2 demo spec', () => {
    beforeEach(() => {
        cy.visit('task/mywork2.html');
    });
    // @see https://www.thisdot.co/blog/testing-web-components-with-cypress-and-typescript
    it('should have h1', () => {
        cy.get('h1')
            .should('contain.text', 'My Work')
        // there is no value-changed message is displayed
        cy.get('.toastify')
            .should('have.length', '0')

        cy.get('.iconbtn.week')
            .click()

        // there is no value-changed message is displayed
        cy.get('.toastify')
            .should('have.length', '0')


        cy.get('.c-0 > .widget')
            .type('foo')


    });

});
