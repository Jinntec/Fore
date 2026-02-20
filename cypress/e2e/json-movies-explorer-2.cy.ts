const DEMO_URL = 'json/json-movies-explorer-2.html';

const MOVIES_REPEAT_SEL = 'fx-repeat#movies';
const ITEM_SEL = 'fx-repeatitem, fx-repeat-item, .repeat-item';

function topLevelItems(repeatEl: HTMLElement): HTMLElement[] {
    return Array.from(repeatEl.children).filter(el =>
        (el as HTMLElement).matches?.(ITEM_SEL),
    ) as HTMLElement[];
}

// ---------- helpers ----------
function moviesRepeat(options: Partial<Cypress.Timeoutable> = {}) {
    return cy.get(MOVIES_REPEAT_SEL, { timeout: 10000, ...options }).should('exist');
}

function owningFore() {
    // find the fx-fore that contains the movies repeat
    return moviesRepeat().closest('fx-fore').should('have.class', 'fx-ready');
}

function movieItems() {
    // Top-level items only (avoid counting nested repeatitems inside rows)
    return moviesRepeat()
        .children(ITEM_SEL)
        .should('have.length.greaterThan', 0);
}

function movieTitleOutputs() {
    return moviesRepeat()
        .children(ITEM_SEL)
        .find('fx-output[ref="?title"]');
}

function readFxOutputValues(selector: Cypress.Chainable<JQuery<HTMLElement>>) {
    return selector.then($els => {
        return Array.from($els).map(el => {
            const anyEl = el as any;
            const v = anyEl.value;
            return (v !== undefined && v !== null ? String(v) : (el.textContent || '')).trim();
        });
    });
}

function queryInput() {
    return owningFore()
        .find(`fx-control[ref="instance('data')?ui?query"] input.widget`, { timeout: 10000 })
        .should('exist');
}

function setQuery(query: string) {
    return queryInput().then($el => {
        const input = $el[0] as HTMLInputElement;
        input.value = query;
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
}

function addInsertTrigger() {
    // Prefer an explicit data-cy hook if present
    return owningFore().then($fore => {
        const foreEl = $fore[0] as HTMLElement;

        const byDataCy = foreEl.querySelector('[data-cy="add-movie"], [data-cy="insert-movie"], [data-cy="add"]');
        if (byDataCy) {
            const trig = byDataCy.closest('fx-trigger');
            if (trig) return cy.wrap(trig);
        }

        // Otherwise: find the fx-trigger that contains an fx-insert targeting instance('data')?movies
        const triggers = Array.from(foreEl.querySelectorAll('fx-trigger'));
        const matches = triggers.filter(tr => {
            const ins = tr.querySelector('fx-insert');
            if (!ins) return false;
            const ref = (ins.getAttribute('ref') || '').trim();
            const hasTemplate = !!ins.querySelector('template');
            const looksLikeMovies =
                ref === "instance('data')?movies" ||
                ref === "instance('data')?movies?*" ||
                ref.includes('?movies');
            return looksLikeMovies && hasTemplate;
        });

        if (!matches.length) {
            throw new Error(
                `Could not find an <fx-trigger> with <fx-insert ref=\"instance('data')?movies...\"> and a <template> in ${DEMO_URL}.`,
            );
        }

        // If there are multiple, prefer the one whose label/button text looks like an add action
        const prefer = matches.find(tr => {
            const txt = (tr.textContent || '').toLowerCase();
            return txt.includes('add') || txt.includes('new') || txt.includes('+') || txt.includes('insert');
        });

        return cy.wrap(prefer || matches[0]);
    });
}

function clickAddMovie() {
    return addInsertTrigger().then($trig => {
        // Prefer clicking the first real clickable control inside the trigger
        const btn = $trig[0].querySelector('button, [role="button"], input[type="button"], input[type="submit"], a');
        if (btn) return cy.wrap(btn as any).click({ force: true });
        return cy.wrap($trig).click({ force: true });
    });
}

function readMoviesLengths() {
    return cy.window().then(win => {
        const repeat = win.document.querySelector('fx-repeat#movies') as any;
        const fore = repeat?.closest?.('fx-fore') as any;
        if (!fore || typeof fore.getModel !== 'function') {
            throw new Error('Could not locate owning fx-fore / model for fx-repeat#movies');
        }

        const inst = fore.getModel().getInstance('data');
        const moviesNode = inst.nodeset.get('movies');

        const rawLen = Array.isArray(inst.instanceData?.movies) ? inst.instanceData.movies.length : NaN;
        const nodeValLen = Array.isArray(moviesNode?.value) ? moviesNode.value.length : NaN;
        const childrenLen = Array.isArray(moviesNode?.children) ? moviesNode.children.length : NaN;

        return { rawLen, nodeValLen, childrenLen };
    });
}

function waitForMoviesModelLen(expectedRawLen: number) {
    return cy.window({ timeout: 15000 }).should(win => {
        const repeat = win.document.querySelector('fx-repeat#movies') as any;
        const fore = repeat?.closest?.('fx-fore') as any;
        if (!fore || typeof fore.getModel !== 'function') {
            throw new Error('Could not locate owning fx-fore / model for fx-repeat#movies');
        }
        const inst = fore.getModel().getInstance('data');
        const rawLen = Array.isArray(inst.instanceData?.movies) ? inst.instanceData.movies.length : NaN;
        expect(rawLen, 'raw movies length').to.equal(expectedRawLen);
    });
}

function waitForMovieDomLen(expectedDomLen: number) {
    // Retry until the *top-level* repeat items match (exclude nested repeats)
    return moviesRepeat({ timeout: 15000 } as any).should($repeat => {
        const repeatEl = $repeat[0] as unknown as HTMLElement;
        const len = topLevelItems(repeatEl).length;
        expect(len, 'repeatitem dom length (top-level)').to.equal(expectedDomLen);
    });
}

// ---------- tests ----------
describe('JSON movies explorer 2', () => {
    beforeEach(() => {
        cy.visit(DEMO_URL);
        owningFore();     // asserts fx-ready
        moviesRepeat();   // asserts repeat exists
        movieItems().should('have.length.greaterThan', 5);
    });

    it('shows many rows initially', () => {
        movieItems().should('have.length.greaterThan', 5);
    });

    it('filters down to Blade Runner when query is "Blade"', () => {
        setQuery('Blade');

        movieItems().should('have.length', 1);

        readFxOutputValues(movieTitleOutputs()).then(titles => {
            expect(titles).to.deep.equal(['Blade Runner']);
        });
    });

    it('inserts a new movie from inline <template> and it renders', () => {
        // Use MODEL lengths as source of truth (DOM can lag a bit behind).
        readMoviesLengths().then(({ rawLen: beforeRawLen, nodeValLen: beforeNodeValLen, childrenLen: beforeChildrenLen }) => {
            expect(beforeRawLen).to.be.a('number');
            expect(beforeNodeValLen).to.be.a('number');
            expect(beforeChildrenLen).to.be.a('number');

            const expected = Number(beforeRawLen) + 1;

            // Click the add trigger
            clickAddMovie();

            // First: model must grow
            waitForMoviesModelLen(expected);

            // Re-read model lengths and assert all are in sync
            readMoviesLengths().then(({ rawLen, nodeValLen, childrenLen }) => {
                expect(rawLen, 'rawLen').to.equal(expected);
                expect(nodeValLen, 'nodeValLen').to.equal(expected);
                expect(childrenLen, 'childrenLen').to.equal(expected);

                // Then: DOM should eventually match lens children length
                waitForMovieDomLen(expected);
                movieItems().should('have.length', expected);

                // Finally: titles should include the template row (often empty title or "New Movie")
                readFxOutputValues(movieTitleOutputs()).then(titles => {
                    const hasEmpty = titles.some(t => t === '');
                    const hasNewMovie = titles.some(t => t.toLowerCase() === 'new movie');
                    expect(hasEmpty || hasNewMovie, 'new row title present').to.equal(true);
                });
            });
        });
    });

    it.skip('updates when query changes multiple times', () => {
        setQuery('Matrix');
        movieItems().should('have.length', 1);
        readFxOutputValues(movieTitleOutputs()).then(titles => {
            expect(titles[0]).to.equal('The Matrix');
        });

        setQuery('Alien');
        movieItems().should('have.length', 1);
        readFxOutputValues(movieTitleOutputs()).then(titles => {
            expect(titles[0]).to.equal('Alien');
        });

        setQuery('');
        movieItems().should('have.length.greaterThan', 5);
    });
});


// In src/fx-repeat.js, inside class FxRepeat:

// Locate the _initTemplate() method and add the following guard at the start of template resolution:

// Example _initTemplate() snippet with guard added:

// _initTemplate() {
//     let template = this._template || this.querySelector('template') || null;

//     // Guard: during startup the template might not be available yet (nested repeats / slotting).
//     // Do not crash; just bail so refresh can retry.
//     if (!template) {
//       // Try inline template as a fallback
//       template = Array.from(this.children).find(c => c && c.localName === 'template') || this.querySelector('template');
//     }
//     if (!template) {
//       console.warn(`fx-repeat#${this.id || ''}: template not found yet; will retry on next refresh.`);
//       return;
//     }

//     // ... rest of existing _initTemplate() logic ...
// }