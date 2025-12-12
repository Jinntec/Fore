import { expect } from '@open-wc/testing';
import { wrapJson } from '../src/json/JSONLens.js';

describe('JSONNode#getPath() for JSON Lenses', () => {
  it('returns path to simple key', () => {
    const wrapped = wrapJson({ person: { name: 'Mark' } }, null, null, 'default');
    const nameNode = wrapped.get('person').get('name');
    expect(nameNode.getPath()).to.equal('$default/person/name');
  });

  it('returns path to array item', () => {
    const wrapped = wrapJson({ list: [{ value: 1 }, { value: 2 }] }, null, null, 'data');
    const itemNode = wrapped
      .get('list')
      .get(1)
      .get('value');
    expect(itemNode.getPath()).to.equal('$data/list[2]/value'); // XPath is 1-based
  });

  it('returns root path', () => {
    const wrapped = wrapJson({ foo: 'bar' }, null, null, 'json');
    expect(wrapped.getPath()).to.equal('$json');
  });

  it('handles nested arrays and objects', () => {
    const json = {
      projects: [{ name: 'Fore', contributors: [{ name: 'User' }] }],
    };
    const wrapped = wrapJson(json, null, null, 'stuff');
    const node = wrapped
      .get('projects')
      .get(0)
      .get('contributors')
      .get(0)
      .get('name');
    expect(node.getPath()).to.equal('$stuff/projects[1]/contributors[1]/name');
  });

  it('escapes keys with special characters', () => {
    const wrapped = wrapJson({ 'foo.bar': { 'x[0]': 'weird' } }, null, null, 'demo');
    const node = wrapped.get('foo.bar').get('x[0]');
    expect(node.getPath()).to.equal("$demo/'foo.bar'/'x[0]'");
  });

  it('returns null for a detached node', () => {
    const root = wrapJson({ a: 42 }, null, null, 'z');
    const node = root.get('a');

    // forcibly detach node
    node.parent = null;
    node.keyOrIndex = null;

    expect(node.getPath()).to.equal(null);
  });
});
