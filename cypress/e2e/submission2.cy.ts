import {join} from 'path';
describe('submission2.html', () => {

    beforeEach(() => {
        cy.visit('submission2.html');
    });

    it('downloads files with special characters', () => {
        cy.get('[data-cy="download"]').click();

        const downloadsFolder = Cypress.config("downloadsFolder");
        cy.readFile(join(downloadsFolder, "saved.xml")).should('contain', `<data>
                            <greeting>Hello World!</greeting>
                            <prop/>
                            <special-characters>é Γ 😻 ! , # 你好 مَرْحَبًا</special-characters>
                            <filename>saved.xml</filename>
                        </data>`)
    })
});
