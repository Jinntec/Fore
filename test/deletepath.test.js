import { expect } from '@open-wc/testing';
import { wrapJson, JSONNode } from '../src/json/JSONNode.js'; // adjust path as needed

describe('JSONNode#delete()', () => {
  it('removes item from array and updates siblings', () => {
    const root = wrapJson({ list: ['a', 'b', 'c'] }, null, null, 'demo');
    const listNode = root.get('list');
    const bNode = listNode.get(1);

    bNode.delete();

    expect(listNode.value).to.deep.equal(['a', 'c']);
    expect(listNode.get(0).value).to.equal('a');
    expect(listNode.get(1).value).to.equal('c');
    expect(listNode.get(1).keyOrIndex).to.equal(1);
  });

  it('removes key from object', () => {
    const root = wrapJson({ obj: { a: 1, b: 2 } }, null, null, 'demo');
    const objNode = root.get('obj');
    const bNode = objNode.get('b');

    bNode.delete();

    expect(objNode.value).to.deep.equal({ a: 1 });
    expect(objNode.get('b')).to.equal(undefined);
  });

  it('does nothing if node has no parent', () => {
    const orphan = wrapJson(42); // root primitive has no parent
    orphan.delete(); // should not throw
    expect(orphan.value).to.equal(42); // remains unchanged
  });

  it('throws when parent is not object or array', () => {
    const wrapped = wrapJson({ parent: 42 });
    const parentNode = wrapped.get('parent');
    const bogusChild = new JSONNode('x', parentNode, 'x', 'demo');

    expect(() => bogusChild.delete()).to.throw(Error);
  });
});
