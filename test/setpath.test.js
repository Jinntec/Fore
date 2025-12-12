import { expect } from '@open-wc/testing';
import { JSONNode } from '../src/json/JSONNode.js'; // adjust path as needed

describe('JSONNode#set()', () => {
  it('replaces value and children for array', () => {
    const node = new JSONNode([1, 2], null, null, 'demo');
    node.set([3, 4]);

    expect(node.value).to.deep.equal([3, 4]);
    expect(node.children.length).to.equal(2);
    expect(node.children[0].value).to.equal(3);
    expect(node.children[1].value).to.equal(4);
  });

  it('replaces value and children for object', () => {
    const node = new JSONNode({ a: 1 }, null, null, 'demo');
    node.set({ b: 2 });

    expect(node.value).to.deep.equal({ b: 2 });
    expect(node.children.length).to.equal(1);
    expect(node.children[0].keyOrIndex).to.equal('b');
    expect(node.children[0].value).to.equal(2);
  });

  it('clears children for primitive value', () => {
    const node = new JSONNode({ a: 1 }, null, null, 'demo');
    node.set('hello');

    expect(node.value).to.equal('hello');
    expect(node.children).to.deep.equal([]);
  });

  it('clears children when setting empty array', () => {
    const node = new JSONNode([1], null, null, 'demo');
    node.set([]);

    expect(node.value).to.deep.equal([]);
    expect(node.children).to.have.length(0);
  });

  it('clears children when setting empty object', () => {
    const node = new JSONNode({ a: 1 }, null, null, 'demo');
    node.set({});

    expect(node.value).to.deep.equal({});
    expect(node.children).to.have.length(0);
  });
});
