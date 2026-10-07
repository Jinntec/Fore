/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent, waitUntil } from '@open-wc/testing';

import '../index.js';

describe('fx-repeat with a value predicate in its ref', () => {
  it('inserts new rows that the repeat selects (origin=#repeat keeps the predicate value)', async () => {
    const el = fixtureSync(html`
      <fx-fore create-nodes="create-nodes">
        <fx-model>
          <fx-instance src="/base/test/data/predicate-repeat.xml"></fx-instance>
        </fx-model>
        <fx-repeat id="r-a" ref="item[kind = 'a']">
          <template>
            <fx-control ref="v"><input type="text" /></fx-control>
          </template>
        </fx-repeat>
        <fx-trigger id="add">
          <button>add</button>
          <fx-insert origin="#r-a" ref="item[kind = 'a']"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    const repeat = el.querySelector('#r-a');
    const rows = () => repeat.querySelectorAll(':scope > fx-repeatitem').length;
    expect(rows()).to.equal(1);

    el.querySelector('#add button').click();
    await waitUntil(() => rows() === 2);

    const doc = el.getModel().instances[0].instanceData;
    const kinds = Array.from(doc.documentElement.children).map(i => i.querySelector('kind').textContent);
    expect(kinds).to.deep.equal(['a', 'a', 'b']);
  });
});
