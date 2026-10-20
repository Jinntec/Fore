import { fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

/**
 * Nodes created by create-nodes must end up in the order of the (nested) fx-bind elements,
 * regardless of the order of the controls in the UI.
 */

const names = el => Array.from(el.children).map(c => c.localName);

/**
 * @param {string} instanceXml content of the data root (the root element is `<root>`)
 * @param {string} binds nested fx-bind markup (inside <fx-bind ref="root">)
 * @param {string[]} controlRefs refs of the controls in UI order
 */
async function run(instanceXml, binds, controlRefs) {
  const controls = controlRefs.map(r => `<fx-control ref="${r}"></fx-control>`).join('');
  const el = fixtureSync(`
    <fx-fore create-nodes>
      <fx-model>
        <fx-instance type="html"><data><root>${instanceXml}</root></data></fx-instance>
        <fx-bind ref="root">${binds}</fx-bind>
      </fx-model>
      <fx-group ref="root">${controls}</fx-group>
    </fx-fore>
  `);
  await oneEvent(el, 'ready');
  const inst = el.querySelector('fx-instance');
  return inst.instanceData.documentElement.firstElementChild; // <root>
}

const ABCD = `<fx-bind ref="a"></fx-bind><fx-bind ref="b"></fx-bind>
              <fx-bind ref="c"></fx-bind><fx-bind ref="d"></fx-bind>`;

describe('create-nodes: ordering by nested binds', () => {
  it('a, c, b in UI order -> a, b, c', async () => {
    const root = await run('', ABCD, ['a', 'c', 'b']);
    expect(names(root)).to.deep.equal(['a', 'b', 'c']);
  });

  it('c, b, a in UI order -> a, b, c', async () => {
    const root = await run('', ABCD, ['c', 'b', 'a']);
    expect(names(root)).to.deep.equal(['a', 'b', 'c']);
  });

  it('d, b, c, a in UI order -> a, b, c, d', async () => {
    const root = await run('', ABCD, ['d', 'b', 'c', 'a']);
    expect(names(root)).to.deep.equal(['a', 'b', 'c', 'd']);
  });

  it('first bind created after a later sibling goes before it', async () => {
    const root = await run('', ABCD, ['c', 'a']);
    expect(names(root)).to.deep.equal(['a', 'c']);
  });

  it('new node goes before an existing following sibling (c preloaded)', async () => {
    const root = await run('<c>C</c>', ABCD, ['b', 'a']);
    expect(names(root)).to.deep.equal(['a', 'b', 'c']);
  });

  it('new node goes after existing preceding sibling (a preloaded)', async () => {
    const root = await run('<a>A</a>', ABCD, ['d', 'c']);
    expect(names(root)).to.deep.equal(['a', 'c', 'd']);
  });

  it('skips sibling binds without nodes in both directions', async () => {
    // a and d exist, c is created, then b: b must land between a and c
    const root = await run('<a>A</a><d>D</d>', ABCD, ['c', 'b']);
    expect(names(root)).to.deep.equal(['a', 'b', 'c', 'd']);
  });

  it('multiple existing occurrences: before all of the following, after all of the preceding', async () => {
    const root = await run('<b>1</b><b>2</b>', ABCD, ['c', 'a']);
    expect(names(root)).to.deep.equal(['a', 'b', 'b', 'c']);
  });

  it('nested binds: children of a group created in reverse UI order', async () => {
    const binds = `<fx-bind ref="a"></fx-bind>
      <fx-bind ref="g"><fx-bind ref="x"></fx-bind><fx-bind ref="y"></fx-bind><fx-bind ref="z"></fx-bind></fx-bind>
      <fx-bind ref="c"></fx-bind>`;
    const root = await run('', binds, ['c', 'g/z', 'g/x', 'g/y', 'a']);
    expect(names(root)).to.deep.equal(['a', 'g', 'c']);
    expect(names(root.querySelector('g'))).to.deep.equal(['x', 'y', 'z']);
  });

  it('nested binds: parent created implicitly by deep ref is placed in bind order', async () => {
    const binds = `<fx-bind ref="a"></fx-bind>
      <fx-bind ref="g"><fx-bind ref="x"></fx-bind><fx-bind ref="y"></fx-bind></fx-bind>
      <fx-bind ref="c"></fx-bind>`;
    const root = await run('<c>C</c>', binds, ['g/y', 'a', 'g/x']);
    expect(names(root)).to.deep.equal(['a', 'g', 'c']);
    expect(names(root.querySelector('g'))).to.deep.equal(['x', 'y']);
  });

  it('sibling bind nodeset is not stale when node was created implicitly', async () => {
    // g (bind 2) is created implicitly via g/y, then a later control creates `b` between a and g
    const binds = `<fx-bind ref="a"></fx-bind><fx-bind ref="b"></fx-bind>
      <fx-bind ref="g"><fx-bind ref="y"></fx-bind></fx-bind><fx-bind ref="d"></fx-bind>`;
    const root = await run('', binds, ['g/y', 'd', 'b', 'a']);
    expect(names(root)).to.deep.equal(['a', 'b', 'g', 'd']);
  });

  it('is independent of UI order for a larger set (permutation check)', async () => {
    const order = ['d', 'a', 'c', 'b'];
    const root = await run('', ABCD, order);
    expect(names(root)).to.deep.equal(['a', 'b', 'c', 'd']);
  });

  it('unbound siblings keep UI order (no binds for the parent)', async () => {
    const el = fixtureSync(`
      <fx-fore create-nodes>
        <fx-model><fx-instance type="html"><data><root/></data></fx-instance></fx-model>
        <fx-group ref="root">
          <fx-control ref="x"></fx-control><fx-control ref="w"></fx-control>
        </fx-group>
      </fx-fore>`);
    await oneEvent(el, 'ready');
    const root = el.querySelector('fx-instance').instanceData.documentElement.firstElementChild;
    expect(names(root)).to.deep.equal(['x', 'w']);
  });

  it('binds that are children of the model order the children of the document element', async () => {
    const el = fixtureSync(`
      <fx-fore create-nodes>
        <fx-model>
          <fx-instance type="html"><data></data></fx-instance>
          <fx-bind ref="a"></fx-bind>
          <fx-bind ref="b"></fx-bind>
          <fx-bind ref="g"><fx-bind ref="x"></fx-bind><fx-bind ref="y"></fx-bind></fx-bind>
          <fx-bind ref="c"></fx-bind>
        </fx-model>
        <fx-group ref=".">
          <fx-control ref="c"></fx-control>
          <fx-control ref="g/y"></fx-control>
          <fx-control ref="b"></fx-control>
          <fx-control ref="g/x"></fx-control>
          <fx-control ref="a"></fx-control>
        </fx-group>
      </fx-fore>`);
    await oneEvent(el, 'ready');
    const data = el.querySelector('fx-instance').instanceData.documentElement;
    expect(names(data)).to.deep.equal(['a', 'b', 'g', 'c']);
    expect(names(data.querySelector('g'))).to.deep.equal(['x', 'y']);
  });
});
