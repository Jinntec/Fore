/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('initData sibling on-demand creation (#321 follow-up)', () => {
  it('places a new sibling under the real parent, not nested inside a previous sibling, when fx-bind ordering is in play', async () => {
    // Several sibling controls directly under a passthrough group (ref=".") each create a new
    // top-level element. fx-bind declaration order is meant to take precedence over UI/DOM order
    // when placing a newly created node (see `_findReferenceNodeForNewElement`'s previousBind
    // handling) - it looks up where the PRECEDING bind's nodeset landed and inserts the new
    // element right after it.
    //
    // That lookup used `parentElement.contains(node)`, which matches ANY descendant, not just a
    // direct child - so it could pick a node buried deep inside the first-created sibling, and
    // `referenceNode.after(newNode)` would then nest the new sibling inside that unrelated
    // subtree instead of placing it beside it under the real parent element. Fixed by walking
    // each candidate up to the ancestor that IS a direct child of parentElement (mirroring the
    // walk-up already used elsewhere in this function) instead of discarding non-direct matches
    // outright - deep bind matches are legitimate and must still resolve to their top-level
    // sibling, not be thrown away.
    const el = await fixtureSync(html`
      <fx-fore
        create-nodes="create-nodes"
        id="fx-invoice"
        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
      >
        <fx-model>
          <fx-instance src="/base/test/data/ubl-invoice-ondemand-empty.xml"></fx-instance>
          <fx-bind ref="cac:InvoiceLine/cbc:InvoicedQuantity" required="true()"></fx-bind>
          <fx-bind ref="*/cbc:DocumentCurrencyCode" required="true()"></fx-bind>
        </fx-model>

        <fx-group id="outer" ref="instance()">
          <fx-group id="BG-11" ref=".">
            <fx-control id="BT-3" ref="cac:OrderReference/cbc:IssueDate"
              ><input type="date"
            /></fx-control>
            <fx-control id="BT-43" ref="cac:LegalMonetaryTotal/cbc:PrepaidAmount"
              ><input type="number"
            /></fx-control>
            <fx-control id="BT-44" ref="cac:InvoiceLine/cac:Price/cbc:PriceAmount"
              ><input type="number"
            /></fx-control>
            <fx-control id="BT-45" ref="cbc:DocumentCurrencyCode"><input type="text" /></fx-control>
          </fx-group>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');

    const root = el.getModel().getDefaultInstance().getDefaultContext();
    const rootElement = Array.isArray(root) ? root[0] : root;
    const serialized = new XMLSerializer().serializeToString(rootElement);

    const childNames = Array.from(rootElement.children).map(c => c.localName);
    expect(childNames, 'sibling elements: ' + serialized).to.include.members([
      'OrderReference',
      'LegalMonetaryTotal',
      'InvoiceLine',
      'DocumentCurrencyCode',
    ]);

    const orderRef = rootElement.querySelector(':scope > OrderReference');
    expect(orderRef, 'OrderReference should be a direct child of the root: ' + serialized).to.exist;
    expect(
      orderRef.querySelector('LegalMonetaryTotal'),
      'LegalMonetaryTotal must not be nested inside OrderReference: ' + serialized,
    ).to.be.null;
    expect(
      orderRef.querySelector('InvoiceLine'),
      'InvoiceLine must not be nested inside OrderReference: ' + serialized,
    ).to.be.null;
  });

  it('still creates the backing node for an on-demand control - on-demand only hides it visually', async () => {
    // `on-demand` is purely a visual/UI concern: the control (and its backing instance node) is
    // created normally by `_initData()` just like any other control - it's only hidden from view
    // until the user reveals it (e.g. via <fx-control-menu>, which removes the attribute; see
    // UIElement.js's `show-control` listener). Node creation must not be skipped for it.
    const el = await fixtureSync(html`
      <fx-fore
        create-nodes="create-nodes"
        id="fx-invoice"
        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
      >
        <fx-model>
          <fx-instance src="/base/test/data/ubl-invoice-ondemand-empty.xml"></fx-instance>
        </fx-model>

        <fx-group id="outer" ref="instance()">
          <fx-group id="BG-11" ref=".">
            <fx-control id="BT-3" ref="cac:OrderReference/cbc:IssueDate" on-demand="true"
              ><input type="date"
            /></fx-control>
          </fx-group>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');

    const root = el.getModel().getDefaultInstance().getDefaultContext();
    const rootElement = Array.isArray(root) ? root[0] : root;

    expect(
      rootElement.querySelector(':scope > OrderReference'),
      'an on-demand control must still get its backing node created',
    ).to.exist;
    expect(el.querySelector('#BT-3').hasAttribute('on-demand')).to.be.true;
  });
});
