/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent, waitUntil } from '@open-wc/testing';

import '../index.js';

const NS = 'urn:test:c';

const fixtureFor = src =>
  fixtureSync(html`
    <fx-fore xmlns:c="urn:test:c" create-nodes="create-nodes">
      <fx-model>
        <fx-instance src="${src}"></fx-instance>
      </fx-model>
      <fx-repeat id="r" ref="c:line">
        <template>
          <fx-control ref="c:id"><input type="text" /></fx-control>
          <fx-control ref="c:note"><input type="text" /></fx-control>
          <fx-control ref="c:detail/c:code"><input type="text" /></fx-control>
          <fx-control ref="c:detail/@scheme"><input type="text" /></fx-control>
        </template>
      </fx-repeat>
      <fx-trigger id="del">
        <button>delete</button>
        <fx-delete ref="c:line"></fx-delete>
      </fx-trigger>
      <fx-trigger id="add">
        <button>add</button>
        <fx-insert origin="#r" ref="c:line"></fx-insert>
      </fx-trigger>
    </fx-fore>
  `);

// create-nodes gives an empty repeat its first row on init; delete rows to get a repeat with none
const emptyRepeat = async el => {
  const instanceData = el.getModel().instances[0].instanceData;
  instanceData.documentElement.replaceChildren();
  await el.refresh(true);
};

const lines = el => Array.from(el.getModel().instances[0].instanceData.documentElement.children);
const shape = line =>
  `${line.localName}(${Array.from(line.children)
    .map(c => `${c.localName}[${Array.from(c.children).map(x => x.localName)}]`)
    .join(',')})`;

describe('fx-repeat row template (create-nodes, origin="#repeat")', () => {
  it('add works for a repeat that has no rows at all', async () => {
    const el = fixtureFor('/base/test/data/repeat-template-row-empty.xml');
    await oneEvent(el, 'ready');
    await emptyRepeat(el);
    const repeat = el.querySelector('#r');
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(0);

    el.querySelector('#add button').click();
    await waitUntil(() => repeat.querySelectorAll(':scope > fx-repeatitem').length === 1);

    expect(lines(el).length).to.equal(1);
    expect(lines(el)[0].namespaceURI).to.equal(NS);
  });

  it('a new row has all nodes of the template and empty values', async () => {
    const loadedFirstRow = async () => {
      const other = fixtureFor('/base/test/data/repeat-template-row.xml');
      await oneEvent(other, 'ready');
      return lines(other)[0];
    };
    const el = fixtureFor('/base/test/data/repeat-template-row-empty.xml');
    await oneEvent(el, 'ready');
    await emptyRepeat(el);
    el.querySelector('#add button').click();
    await waitUntil(() => lines(el).length === 1);

    const row = lines(el)[0];
    expect(Array.from(row.children).map(c => c.localName)).to.deep.equal(['id', 'note', 'detail']);
    expect(row.querySelector('detail').children[0].localName).to.equal('code');
    // same as for the loaded rows: initData creates the element nodes of the template's controls
    expect(row.querySelector('detail').getAttribute('scheme')).to.equal(
      (await loadedFirstRow()).querySelector('detail').getAttribute('scheme'),
    );
    expect(row.textContent.trim()).to.equal('');
  });

  it('the shape of a new row does not depend on how complete the loaded rows are', async () => {
    const el = fixtureFor('/base/test/data/repeat-template-row.xml');
    await oneEvent(el, 'ready');
    // loaded rows are incomplete (row 1 has no note) - initData completes them, a new row must be complete too
    el.querySelector('#add button').click();
    await waitUntil(() => lines(el).length === 3);

    const [first, second, added] = lines(el);
    expect(shape(added)).to.equal(shape(first));
    expect(shape(added)).to.equal(shape(second));
    expect(added.querySelector('id').textContent).to.equal('');
  });

  it('creating the template does not leave a temporary row or touch the data', async () => {
    const el = fixtureFor('/base/test/data/repeat-template-row-empty.xml');
    await oneEvent(el, 'ready');
    await emptyRepeat(el);
    const repeat = el.querySelector('#r');
    const before = el.getModel().instances[0].instanceData.documentElement.outerHTML;

    const template = repeat.getCreatedNodeset();

    expect(template.localName).to.equal('line');
    expect(template.parentNode).to.be.null;
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(0);
    expect(el.getModel().instances[0].instanceData.documentElement.outerHTML).to.equal(before);
  });

  it('building the template leaves no ModelItems behind', async () => {
    const el = fixtureFor('/base/test/data/repeat-template-row.xml');
    await oneEvent(el, 'ready');
    const model = el.getModel();
    const count = model.modelItems.length;
    const byPath = model._modelItemsByPath.size;

    el.querySelector('#r').getCreatedNodeset();

    expect(model.modelItems.length).to.equal(count);
    expect(model._modelItemsByPath.size).to.equal(byPath);
  });

  it('a repeat with a multi-step ref gets the last step as its row template', async () => {
    const el = fixtureSync(html`
      <fx-fore xmlns:c="urn:test:c" create-nodes="create-nodes">
        <fx-model>
          <fx-instance src="/base/test/data/repeat-template-row-empty.xml"></fx-instance>
        </fx-model>
        <fx-repeat id="r" ref="c:total/c:sub">
          <template>
            <fx-control ref="c:amount"><input type="text" /></fx-control>
          </template>
        </fx-repeat>
        <fx-trigger id="add">
          <button>add</button>
          <fx-insert origin="#r" ref="c:total/c:sub"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    const repeat = el.querySelector('#r');

    const template = repeat.getCreatedNodeset();
    expect(template.localName).to.equal('sub');
    expect(Array.from(template.children).map(c => c.localName)).to.deep.equal(['amount']);

    el.querySelector('#add button').click();
    await waitUntil(() => repeat.querySelectorAll(':scope > fx-repeatitem').length === 2);
    const root = el.getModel().instances[0].instanceData.documentElement;
    expect(root.querySelectorAll('sub').length).to.equal(2);
  });

  it('add into a multi-step repeat that has no rows creates the missing parent steps', async () => {
    const el = fixtureSync(html`
      <fx-fore xmlns:c="urn:test:c" create-nodes="create-nodes">
        <fx-model>
          <fx-instance src="/base/test/data/repeat-template-row-empty.xml"></fx-instance>
        </fx-model>
        <fx-repeat id="r" ref="c:total/c:sub">
          <template>
            <fx-control ref="c:amount"><input type="text" /></fx-control>
          </template>
        </fx-repeat>
        <fx-trigger id="add">
          <button>add</button>
          <fx-insert origin="#r" ref="c:total/c:sub"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    const repeat = el.querySelector('#r');
    const root = el.getModel().instances[0].instanceData.documentElement;
    root.replaceChildren(); // no c:total at all
    await el.refresh(true);
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(0);

    el.querySelector('#add button').click();
    await waitUntil(() => repeat.querySelectorAll(':scope > fx-repeatitem').length === 1);

    expect(Array.from(root.children).map(c => c.localName)).to.deep.equal(['total']);
    expect(root.firstElementChild.children[0].localName).to.equal('sub');
  });
});
