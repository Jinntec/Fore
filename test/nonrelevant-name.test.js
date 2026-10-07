/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent, waitUntil } from '@open-wc/testing';

import '../index.js';

describe('template expressions in nonrelevant elements', () => {
  it('evaluates the name of a nonrelevant element, but not its other content', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance src="/base/test/data/predicate-repeat.xml"></fx-instance>
          <fx-instance type="json" id="lang">{"name": "Unit", "other": "Other"}</fx-instance>
        </fx-model>
        <fx-group id="g" ref="missing" aria-label="{instance('lang')?name}">
          <fx-control id="c" ref="item[1]/v"><label>{instance('lang')?name}</label><input /></fx-control>
          <p id="p">{instance('lang')?other}</p>
        </fx-group>
        <fx-control id="n" ref="missing/x"><label id="nl">{instance('lang')?name}</label><input /></fx-control>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');

    expect(el.querySelector('#g').hasAttribute('nonrelevant')).to.be.true;
    await waitUntil(() => el.querySelector('#g').getAttribute('aria-label') === 'Unit');
    // the label of the nonrelevant control itself is evaluated ...
    await waitUntil(() => el.querySelector('#nl').textContent === 'Unit');
    // ... content inside a nonrelevant element is not
    expect(el.querySelector('#p').textContent).to.equal('{instance(\'lang\')?other}');
    expect(el.querySelector('#c label').textContent).to.equal("{instance('lang')?name}");
  });
});
