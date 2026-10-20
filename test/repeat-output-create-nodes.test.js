/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent, waitUntil } from '@open-wc/testing';

import '../index.js';

const lines = el =>
  Array.from(el.getModel().instances[0].instanceData.documentElement.children).filter(
    c => c.localName === 'line',
  );

describe('create-nodes: fx-output bound to a missing node', () => {
  it('creates the node for each repeat row, including inserted ones, so a calculate can write it (row 1: value computed)', async () => {
    const el = fixtureSync(html`
      <fx-fore xmlns:c="urn:test:c" create-nodes="create-nodes">
        <fx-model>
          <fx-instance src="/base/test/data/repeat-output-missing.xml"></fx-instance>
          <fx-bind ref="c:line/c:total" calculate="42"></fx-bind>
        </fx-model>
        <fx-repeat id="r" ref="c:line">
          <template>
            <fx-control ref="c:id"><input type="text" /></fx-control>
            <fx-output ref="c:total"></fx-output>
          </template>
        </fx-repeat>
        <fx-trigger id="add">
          <button>add</button>
          <fx-insert origin="#r" ref="c:line"></fx-insert>
          <fx-update></fx-update>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    expect(lines(el)[0].querySelector('total'), 'first row has c:total').to.exist;
    expect(lines(el)[0].querySelector('total').textContent, 'row 1 calculated').to.equal('42');

    el.querySelector('#add button').click();
    await waitUntil(() => lines(el).length === 2);
    await new Promise(r => setTimeout(r, 200));
    expect(lines(el)[1].querySelector('total'), 'inserted row has c:total').to.exist;
    expect(lines(el)[1].querySelector('total').textContent, 'row 2 calculated').to.equal('42');
  });
});
