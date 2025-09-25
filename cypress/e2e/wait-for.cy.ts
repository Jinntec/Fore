// Utility: wait for a specific fx-fore's "ready" without relying on framework internals
/*
function waitReady(win, el) {
  if (el.ready === true) return Promise.resolve();
  return new Promise((resolve) => {
    const onReady = (ev) => {
      if (ev.target === el) {
        cleanup();
        resolve();
      }
    };
    const cleanup = () => win.document.removeEventListener('ready', onReady, true);
    win.document.addEventListener('ready', onReady, true);
  });
}


// Utility: record global order of ready events
function attachOrderRecorder(win) {
  win.__foreOrder = [];
  const handler = (ev) => {
    if (ev.target?.tagName === 'FX-FORE') {
      win.__foreOrder.push(ev.target.id || '(anon)');
    }
  };
  win.__foreCleanup = () => win.document.removeEventListener('ready', handler, true);
  win.document.addEventListener('ready', handler, true);
}


// Minimal helper to create an element with attributes
function createFore(win, attrs = {}, parent = win.document.body) {
  const el = win.document.createElement('fx-fore');
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  parent.appendChild(el);
  return el;
}


// (Optional) If your implementation sometimes replaces elements, ensure IDs are set before ready
function setId(el, id) { el.id = id; }
*/


describe('<fx-fore> wait-for (Cypress)', () => {
  beforeEach(() => {
    cy.visit('fx-fore/wait-for-sibling.html');
  });


  it('sibling waits for dependency (wait-for="#login")', () => {
    cy.get('fx-fore.fx-ready')

    cy.get('.toastify')
      .should('have.length', '4')

    /*
    toasts are inserted always on top so we need to check indexes in reverse order
     */
    cy.get('.toastify').eq(0)
      .should('be.visible')
      .should('contain', 'Check 1 + 2 ready - Engine running');

    cy.get('.toastify').eq(1)
      .should('be.visible')
      .should('contain', 'Check 2 ready');

    cy.get('.toastify').eq(2)
      .should('be.visible')
      .should('contain', 'Check 1 ready');

    cy.get('.toastify').eq(3)
      .should('be.visible')
      .should('contain', 'not waiting');

/*
    cy.get('.toastify').eq(1)
      .should('be.visible')
      .should('contain', 'World ready');
*/
  });


/*
  it('waits for multiple dependencies (wait-for="#a,#b")', () => {
    cy.window().then(async (win) => {
      const a = createFore(win);
      setId(a, 'a');
      const b = createFore(win);
      setId(b, 'b');
      const c = createFore(win, { 'wait-for': '#a,#b' });
      setId(c, 'c');


      await waitReady(win, a);
      await waitReady(win, b);
      await waitReady(win, c);


      const order = win.__foreOrder;
      expect(order.at(-1)).to.equal('c');
      expect(order.slice(0, -1)).to.include.members(['a', 'b']);
    });
  });
*/


/*
  it('nested fore waits for nearest outer (wait-for="closest")', () => {
    cy.window().then(async (win) => {
      const outer = createFore(win);
      setId(outer, 'outer');
// mount inner inside outer
      const inner = createFore(win, { 'wait-for': 'closest' }, outer);
      setId(inner, 'inner');


      await waitReady(win, outer);
      await waitReady(win, inner);


      expect(win.__foreOrder).to.deep.equal(['outer', 'inner']);
    });
  });
*/


/*
  it('does not fire when dependency is missing (or update this if you fallback)', () => {
    cy.window().then(async (win) => {
      const x = createFore(win, { 'wait-for': '#not-there' });
      setId(x, 'x');


// give it a short grace period; adjust if your impl falls back instead of strict-waiting
      await new Promise((r) => setTimeout(r, 200));
      expect(win.__foreOrder).to.not.include('x');
    });
  });
*/


  afterEach(() => {
    cy.window().then((win) => win.__foreCleanup?.());
  });
});