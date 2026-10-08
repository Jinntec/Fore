/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent, waitUntil } from '@open-wc/testing';

import '../index.js';

const root = el => el.getModel().instances[0].instanceData.documentElement;
const text = (el, name) => root(el).querySelector(name)?.textContent;

const fixture = () =>
  fixtureSync(html`
    <fx-fore xmlns:c="urn:test:c" create-nodes="create-nodes">
      <fx-model>
        <fx-instance src="/base/test/data/insert-delete-recalc.xml"></fx-instance>
        <fx-bind ref="c:line/c:doubled" calculate="42"></fx-bind>
        <fx-bind ref="c:sum" calculate="sum(../c:line/c:amount)"></fx-bind>
      </fx-model>
      <fx-repeat id="r" ref="c:line">
        <template>
          <fx-control ref="c:amount"><input type="text" /></fx-control>
          <fx-output ref="c:doubled"></fx-output>
        </template>
      </fx-repeat>
      <fx-output id="sum" ref="c:sum"></fx-output>
      <fx-trigger id="add">
        <button>add</button>
        <fx-insert origin="#r" ref="c:line"></fx-insert>
      </fx-trigger>
      <fx-trigger id="add-update">
        <button>add + update</button>
        <fx-insert origin="#r" ref="c:line"></fx-insert>
        <fx-update></fx-update>
      </fx-trigger>
      <fx-trigger id="del">
        <button>delete</button>
        <fx-delete ref="c:line[1]"></fx-delete>
      </fx-trigger>
    </fx-fore>
  `);

describe('rows added by fx-insert and calculate binds', () => {
  it('a row added by fx-insert + fx-update is calculated right away', async () => {
    const el = fixture();
    await oneEvent(el, 'ready');
    expect(text(el, 'sum'), 'sum initially').to.equal('3');

    // insert alone does not rebuild the model (expensive); fx-update after it makes the binds see the new row
    el.querySelector('#add-update button').click();
    await waitUntil(() => root(el).querySelectorAll(':scope > line').length === 3);
    await new Promise(r => setTimeout(r, 200));

    const rows = Array.from(root(el).querySelectorAll(':scope > line'));
    expect(rows[2].querySelector('doubled')?.textContent, 'inserted row calculated').to.equal('42');
  });

  it('a sum over the rows is recalculated after fx-delete', async () => {
    const el = fixture();
    await oneEvent(el, 'ready');
    expect(text(el, 'sum')).to.equal('3');

    el.querySelector('#del button').click();
    await waitUntil(() => root(el).querySelectorAll(':scope > line').length === 1);
    await new Promise(r => setTimeout(r, 200));
    expect(text(el, 'sum'), 'sum after delete').to.equal('2');
  });
});
