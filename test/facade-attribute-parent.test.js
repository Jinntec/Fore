import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';
import '../index.js';

describe('DependencyNotifyingDomFacade and attributes', () => {
  it('a ref with a function can go to the parent of an attribute context', async () => {
    const fore = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html"
            ><data><item on="yes">A</item></data></fx-instance
          >
        </fx-model>
        <fx-group ref="item/@on">
          <fx-output id="o" ref="(..)[1]"></fx-output>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(fore, 'ready');
    expect(fore.querySelector('#o').value).to.equal('A');
  });

  it('a plain ref can go to the parent of an attribute context', async () => {
    const fore = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html"
            ><data><item on="yes">A</item></data></fx-instance
          >
        </fx-model>
        <fx-group ref="item/@on">
          <fx-output id="o" ref=".."></fx-output>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(fore, 'ready');
    expect(fore.querySelector('#o').value).to.equal('A');
  });
});
