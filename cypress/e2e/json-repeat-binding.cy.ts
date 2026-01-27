// cypress/e2e/json-repeat-binding.cy.js

function clickButtonAndWaitRefresh(label) {
    return cy.window().then(
        win =>
            new Cypress.Promise(resolve => {
                const fore = win.document.querySelector('fx-fore');
                if (!fore) throw new Error('No <fx-fore> found');

                const btn = Array.from(win.document.querySelectorAll('button')).find(
                    b => (b.textContent || '').trim() === label,
                );
                if (!btn) throw new Error(`Button not found: "${label}"`);

                fore.addEventListener('refresh-done', () => resolve(), { once: true });
                btn.click();
            }),
    );
}

function getJsonItems(win) {
    const fore = win.document.querySelector('fx-fore');
    const model = fore?.querySelector('fx-model');

    const inst =
        (model?.getInstance && model.getInstance('default')) ||
        (model?.instances && model.instances[0]) ||
        null;

    const data =
        inst?.instanceData ||
        inst?.jsonData ||
        (typeof inst?.getInstanceData === 'function' ? inst.getInstanceData() : null) ||
        (typeof inst?.getDefaultContext === 'function' ? inst.getDefaultContext() : null);

    if (!data) throw new Error('Could not access JSON instance data');
    if (!Array.isArray(data.items)) throw new Error('Expected data.items to be an array');
    return data.items;
}

function rowIdInput(rowIndex0) {
    return cy
        .get('fx-repeat#items > fx-repeatitem')
        .eq(rowIndex0)
        .find('fx-control[ref="?id"] input.widget');
}

function rowNameInput(rowIndex0) {
    return cy
        .get('fx-repeat#items > fx-repeatitem')
        .eq(rowIndex0)
        .find('fx-control[ref="?name"] input.widget');
}

function expectRepeatIndexMarkerAt(pos0) {
    cy.get('fx-repeat#items > fx-repeatitem').should('have.length.greaterThan', pos0);

    // exactly one marker
    cy.get('fx-repeat#items > fx-repeatitem[repeat-index]').should('have.length', 1);

    // marker is at expected DOM position
    cy.get('fx-repeat#items > fx-repeatitem')
        .eq(pos0)
        .should('have.attr', 'repeat-index');
}

describe('JSON repeat + insert/delete keeps UI and data in sync', () => {
    beforeEach(() => {
        cy.visit('json/json-repeat-binding.html');
        cy.get('fx-fore.fx-ready');
        cy.get('fx-repeat#items').should('exist');
        cy.get('fx-repeat#items > fx-repeatitem').should('have.length', 3);
    });

    it('append adds empty row at end and UI matches JSON', () => {
        rowIdInput(0).should('have.value', '1');
        rowNameInput(0).should('have.value', 'Item 1');

        clickButtonAndWaitRefresh('append');

        cy.get('fx-repeat#items > fx-repeatitem').should('have.length', 4);

        // repeat selects inserted row (last)
        cy.get('fx-repeat#items').should('have.attr', 'index', '4');
        expectRepeatIndexMarkerAt(3);

        // UI: last row empty
        rowIdInput(3).should('have.value', '');
        rowNameInput(3).should('have.value', '');

        // JSON: last item empty
        cy.window().then(win => {
            const items = getJsonItems(win);
            expect(items).to.have.length(4);
            expect(String(items[3].id)).to.equal('');
            expect(String(items[3].name)).to.equal('');
        });
    });

    it('insert as first shifts existing rows down; UI matches JSON', () => {
        clickButtonAndWaitRefresh('insert as first');

        cy.get('fx-repeat#items > fx-repeatitem').should('have.length', 4);

        // repeat selects inserted row (first)
        cy.get('fx-repeat#items').should('have.attr', 'index', '1');
        expectRepeatIndexMarkerAt(0);

        // UI: first row empty, second is old first
        rowIdInput(0).should('have.value', '');
        rowNameInput(0).should('have.value', '');
        rowIdInput(1).should('have.value', '1');
        rowNameInput(1).should('have.value', 'Item 1');

        // JSON: items[0] empty, items[1] is old first
        cy.window().then(win => {
            const items = getJsonItems(win);
            expect(items).to.have.length(4);
            expect(String(items[0].id)).to.equal('');
            expect(String(items[0].name)).to.equal('');
            expect(items[1].id).to.equal(1);
            expect(items[1].name).to.equal('Item 1');
        });
    });

    it('insert after first + setvalue via ?items[index("items")]?name updates correct row', () => {
        clickButtonAndWaitRefresh('insert after first');

        cy.get('fx-repeat#items > fx-repeatitem').should('have.length', 4);

        // Newly inserted row should be 2nd row (pos0=1)
        rowNameInput(1).should('have.value', 'newItemAfterFirst');

        cy.window().then(win => {
            const items = getJsonItems(win);
            expect(items).to.have.length(4);
            expect(items[1].name).to.equal('newItemAfterFirst');
        });
    });

    it('insert after current using at="index(\'items\')" works and stays in sync', () => {
        // Make current = 1 explicitly (and stable)
        clickButtonAndWaitRefresh('insert as first');
        cy.get('fx-repeat#items').should('have.attr', 'index', '1');

        // Now insert after current
        clickButtonAndWaitRefresh('insert after current');

        cy.get('fx-repeat#items > fx-repeatitem').should('have.length', 5);

        // Inserted row should be right after current => row 2 (pos0=1)
        rowIdInput(1).should('have.value', '');
        rowNameInput(1).should('have.value', '');

        cy.window().then(win => {
            const items = getJsonItems(win);
            expect(items).to.have.length(5);
            expect(String(items[1].id)).to.equal('');
            expect(String(items[1].name)).to.equal('');
        });
    });
});