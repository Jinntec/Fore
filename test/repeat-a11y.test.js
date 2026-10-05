/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixtureSync, expect, waitUntil } from '@open-wc/testing';

import '../index.js';

describe('repeat accessibility', () => {
  async function buildFixture(size = '') {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data><i n="a"></i><i n="b"></i><i n="c"></i><i n="d"></i></data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="r" ref="i" size=${size}>
          <template>
            <fx-control id="c1" ref="@n">
              <label for="w1">Name</label>
              <input id="w1" />
            </fx-control>
            <fx-trigger id="del"><button aria-label="Delete {@n}">x</button></fx-trigger>
          </template>
        </fx-repeat>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    return el;
  }

  it('points each row label at its own widget', async () => {
    const el = await buildFixture();
    const rows = Array.from(el.querySelectorAll('fx-repeatitem'));
    expect(rows.length).to.equal(4);
    const widgetIds = rows.map(r => r.querySelector('input').id);
    expect(new Set(widgetIds).size).to.equal(4);
    rows.forEach(r => {
      const label = r.querySelector('label');
      expect(label.getAttribute('for')).to.equal(r.querySelector('input').id);
    });
    // no duplicate ids among the native widgets
    const all = Array.from(el.querySelectorAll('input[id]')).map(i => i.id);
    expect(new Set(all).size).to.equal(all.length);
  });

  it('keeps the authored ids of Fore elements, which Fore resolves per row', async () => {
    const el = await buildFixture();
    el.querySelectorAll('fx-repeatitem').forEach(r => {
      expect(r.querySelector('fx-control').id).to.equal('c1');
      expect(r.querySelector('fx-trigger').id).to.equal('del');
    });
  });

  it('gives repeated buttons a row specific name', async () => {
    const el = await buildFixture();
    const names = Array.from(el.querySelectorAll('fx-repeatitem button')).map(b =>
      b.getAttribute('aria-label'),
    );
    expect(names).to.deep.equal(['Delete a', 'Delete b', 'Delete c', 'Delete d']);
  });

  it('exposes position and set size on the rows', async () => {
    const el = await buildFixture();
    const rows = Array.from(el.querySelectorAll('fx-repeatitem'));
    expect(rows.map(r => r.getAttribute('aria-posinset'))).to.deep.equal(['1', '2', '3', '4']);
    expect(rows.every(r => r.getAttribute('aria-setsize') === '4')).to.be.true;
  });

  it('reports the full set size when only part of the rows is rendered', async () => {
    const el = await buildFixture('2');
    const rows = Array.from(el.querySelectorAll('fx-repeatitem'));
    expect(rows.length).to.equal(2);
    expect(rows.every(r => r.getAttribute('aria-setsize') === '4')).to.be.true;
  });

  it('renumbers position and set size after a row was deleted', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data><i n="a"></i><i n="b"></i><i n="c"></i></data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="r" ref="i">
          <template>
            <span>{@n}</span>
            <fx-trigger><button>delete</button><fx-delete ref="."></fx-delete></fx-trigger>
          </template>
        </fx-repeat>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    el.querySelectorAll('fx-repeatitem')[1].querySelector('button').click();
    await waitUntil(() => el.querySelectorAll('fx-repeatitem').length === 2);
    await waitUntil(() =>
      Array.from(el.querySelectorAll('fx-repeatitem')).every(
        r => r.getAttribute('aria-setsize') === '2',
      ),
    );
    const rows = Array.from(el.querySelectorAll('fx-repeatitem'));
    expect(rows.map(r => r.getAttribute('aria-posinset'))).to.deep.equal(['1', '2']);
  });
});
