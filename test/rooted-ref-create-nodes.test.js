/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

const root = el => el.getModel().instances[0].instanceData.documentElement;

describe('create-nodes: refs rooted at $default', () => {
  it('creates the node below the document element, not in the surrounding group', async () => {
    const el = fixtureSync(html`
      <fx-fore create-nodes="create-nodes">
        <fx-model>
          <fx-instance>
            <data>
              <totals></totals>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group ref="totals">
          <fx-control ref="net"><input type="text" /></fx-control>
          <fx-control ref="$default/tax/amount"><input type="text" /></fx-control>
          <fx-control ref="gross"><input type="text" /></fx-control>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    const totals = root(el).querySelector('totals');
    expect(Array.from(totals.children).map(c => c.localName)).to.deep.equal(['net', 'gross']);
    expect(root(el).querySelector(':scope > tax > amount'), 'tax/amount below the root').to.exist;
  });
});
