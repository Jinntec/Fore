function getDefaultInstanceDoc(win: Cypress.AUTWindow) {
  const fore = win.document.querySelector('#fx-invoice') as any;
  return fore.getModel().getDefaultInstance().getInstanceData();
}

// Bare-tag-name querySelector is unreliable against namespaced XML elements once nested
// (behavior differs between top-level document.querySelector and element.querySelector on
// these fixtures) - matching by localName side-steps namespace/CSS-selector quirks entirely.
function childByLocalName(el: Element, localName: string): Element | undefined {
  return Array.from(el.children).find(child => child.localName === localName);
}

function elementsByLocalName(doc: Document, localName: string): Element[] {
  return Array.from(doc.getElementsByTagName('*')).filter(el => el.localName === localName);
}

describe('create-nodes/bug.html', () => {
  beforeEach(() => {
    cy.visit('create-nodes/bug.html');
    cy.get('#fx-invoice.fx-ready');
  });

  it('reuses the existing InvoicePeriod instead of creating a duplicate sibling (#321)', () => {
    // create-nodes mode eagerly creates every bound control's referenced node on load - this is
    // exactly when the bug fired: BT-8's ref ("cac:InvoicePeriod/cbc:DescriptionCode") used to
    // create a *second*, duplicate InvoicePeriod to hold DescriptionCode instead of reusing the
    // one BT-73/BT-74 are already bound to (see test/createNodes.test.js's #321 unit test for
    // the equivalent non-UI reproduction).
    cy.window().should(win => {
      const periods = elementsByLocalName(getDefaultInstanceDoc(win), 'InvoicePeriod');
      expect(periods, 'no duplicate InvoicePeriod should have been created').to.have.length(1);

      const period = periods[0];
      expect(childByLocalName(period, 'StartDate')?.textContent).to.equal('2019-02-01');
      expect(childByLocalName(period, 'EndDate')?.textContent).to.equal('2019-05-07');
      expect(childByLocalName(period, 'DescriptionCode'), 'DescriptionCode should exist').to.not.equal(
        undefined,
      );
    });
  });

  it('creates a namespaced element/value structure from a ref with a namespace prefix inside a predicate', () => {
    // ref="cac:AdditionalItemProperty[cbc:Name='RightType']/cbc:Value" - the [cbc:Name='RightType']
    // predicate has a namespaced name, exactly the case the namespace-prefix regex fix covers.
    // Eagerly created on load: AdditionalItemProperty/Name='RightType' should already exist.
    cy.window().should(win => {
      const props = elementsByLocalName(getDefaultInstanceDoc(win), 'AdditionalItemProperty');
      expect(props, 'AdditionalItemProperty should have been eagerly created').to.have.length(1);
      expect(childByLocalName(props[0], 'Name')?.textContent).to.equal('RightType');
      expect(childByLocalName(props[0], 'Value')?.textContent).to.equal('');
    });

    // Typing into the Value control must still target that same, single AdditionalItemProperty.
    cy.get('#BT-ns-test-input').type('hello-ns-value').blur();

    cy.window().should(win => {
      const props = elementsByLocalName(getDefaultInstanceDoc(win), 'AdditionalItemProperty');
      expect(props, 'still only one AdditionalItemProperty after setting a value').to.have.length(1);
      expect(childByLocalName(props[0], 'Name')?.textContent).to.equal('RightType');
      expect(childByLocalName(props[0], 'Value')?.textContent).to.equal('hello-ns-value');
    });
  });
});
