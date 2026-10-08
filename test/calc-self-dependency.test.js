/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('calculate that reads sibling nodes of the calculated node', () => {
  it('does not make the calculated node depend on itself', async () => {
    const el = fixtureSync(html`
      <fx-fore xmlns:c="urn:test:c">
        <fx-model>
          <fx-instance src="/base/test/data/calc-self-dependency.xml"></fx-instance>
          <!-- the shape the generator emits: several c:charge match, followed by a parenthesized step -->
          <fx-bind ref="c:line/c:total" calculate="sum((let $x := ../c:charge/c:amount/(if(string()) then . else 0) return if (exists($x)) then $x else 0))"></fx-bind>
        </fx-model>
        <fx-output ref="c:line/c:total"></fx-output>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    const model = el.getModel();
    const total = el.getModel().instances[0].instanceData.querySelector('total');
    // no self edge: that would make overallOrder() throw "Cyclic"
    expect(() => model.mainGraph.overallOrder(false)).to.not.throw();

    // a full recalculation (empty "changed") must not throw "Cyclic"
    model.changed = [];
    await model.recalculate();
    expect(total.textContent).to.equal('3');
  });
});
