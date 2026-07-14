import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';
import { isDynamic, getDocPath, getPath } from '../src/xpath-path.js';

function parseXml(str) {
  return new DOMParser().parseFromString(str, 'application/xml');
}

describe('getDocPath (native fast path)', () => {
  it('drops the root element from a deeper path', () => {
    const doc = parseXml('<root><item id="0"/><item id="1"/></root>');
    const items = doc.documentElement.querySelectorAll('item');
    expect(getDocPath(items[0])).to.equal('/item[1]');
    expect(getDocPath(items[1])).to.equal('/item[2]');
  });

  it('keeps the root element whole when asked for the root itself', () => {
    const doc = parseXml('<root><item/></root>');
    expect(getDocPath(doc.documentElement)).to.equal('/root[1]');
  });

  it('returns "/" for the document node', () => {
    const doc = parseXml('<root/>');
    expect(getDocPath(doc)).to.equal('/');
  });

  it('indexes same-name siblings independently of interleaved different-name siblings', () => {
    const doc = parseXml('<root><a/><b/><a/><a/><b/><c/></root>');
    const children = Array.from(doc.documentElement.children);
    const paths = children.map(c => getDocPath(c));
    expect(paths).to.deep.equal([
      '/a[1]', '/b[1]', '/a[2]', '/a[3]', '/b[2]', '/c[1]',
    ]);
  });

  it('computes nested element paths', () => {
    const doc = parseXml('<root><a><g/></a></root>');
    const g = doc.documentElement.querySelector('g');
    expect(getDocPath(g)).to.equal('/a[1]/g[1]');
  });

  it('computes attribute paths without indexing the attribute itself', () => {
    const doc = parseXml('<root><item id="0"/><item id="1"/><item id="2"/></root>');
    const items = doc.documentElement.querySelectorAll('item');
    expect(getDocPath(items[2].getAttributeNode('id'))).to.equal('/item[3]/@id');
  });

  it('indexes non-adjacent text nodes separated by an element', () => {
    const doc = parseXml('<root><a>t1<g/>t2</a></root>');
    const a = doc.documentElement.querySelector('a');
    expect(getDocPath(a.childNodes[0])).to.equal('/a[1]/text()[1]');
    expect(getDocPath(a.childNodes[2])).to.equal('/a[1]/text()[2]');
  });

  it('computes comment and processing-instruction paths', () => {
    const doc = parseXml('<root><?target data?><!--hi--></root>');
    const pi = doc.documentElement.childNodes[0];
    const comment = doc.documentElement.childNodes[1];
    expect(getDocPath(pi)).to.equal('/processing-instruction(target)[1]');
    expect(getDocPath(comment)).to.equal('/comment()[1]');
  });

  it('getPath prefixes the doc path with the instance id', async () => {
    // getPath() requires a matching <fx-instance id="..."> in the real document for any
    // non-'default' instanceId - a plain tag is enough, it's only ever queried by selector.
    await fixtureSync(html`<fx-instance id="codelist"></fx-instance>`);
    const doc = parseXml('<root><item id="0"/><item id="1"/></root>');
    const items = doc.documentElement.querySelectorAll('item');
    expect(getPath(items[1], 'codelist')).to.equal('$codelist/item[2]');
  });
});

describe('XPathUtil Tests', () => {
  it('isDymanic returns true for "index" func', async () => {
    expect(isDynamic('index("foo")')).to.equal(true);
  });
  it('isDymanic returns true for "instance()" func', async () => {
    expect(isDynamic('instance()')).to.equal(true);
  });
  it('isDymanic returns true for "context()" func', async () => {
    expect(isDynamic('context()/foo')).to.equal(true);
  });
  it('isDymanic returns true for any func', async () => {
    expect(isDynamic('myfunc()')).to.equal(true);
  });
  it('isDymanic returns true for any func with args', async () => {
    expect(isDynamic('myfunc("foo","bar")')).to.equal(true);
  });
  it('isDymanic returns true for any func with locationpath args', async () => {
    expect(isDynamic('myfunc(foo/bar, //bar)')).to.equal(true);
  });
  it('isDymanic returns true for any func with variable as arg', async () => {
    expect(isDynamic('myfunc($var,"bar")')).to.equal(true);
  });
  it('isDymanic returns true for a var', async () => {
    expect(isDynamic('$var')).to.equal(true);
  });
  it('isDymanic returns true for some text and a var', async () => {
    expect(isDynamic('"some text" || $var')).to.equal(true);
  });
  it('isDymanic returns false for some text', async () => {
    expect(isDynamic('"some text"')).to.equal(false);
  });
  it('isDymanic returns false for some concatenated text', async () => {
    expect(isDynamic('"some text" || ""')).to.equal(false);
  });
  it('isDymanic returns false for some concatenated text using concat', async () => {
    expect(isDynamic('concat("some concatted"," text")')).to.equal(false);
  });
  it('isDymanic returns false for string-length on fixed string', async () => {
    expect(isDynamic('string-length("some concatted")')).to.equal(false);
  });
  it('isDymanic returns true for string-length on locationpath', async () => {
    expect(isDynamic('string-length(foo)')).to.equal(true);
  });
  it('isDymanic returns true for pathes with predicates', async () => {
    expect(isDynamic('foo[true]')).to.equal(true);
  });
  it('isDynamic returns true for path with literal predicate', async () => {
    expect(isDynamic('foo[1]')).to.equal(true);
  });

  it('isDynamic returns true for path with boolean predicate', async () => {
    expect(isDynamic('foo[true()]')).to.equal(true);
  });

  it('isDynamic returns true for path with location predicate', async () => {
    expect(isDynamic('foo[bar]')).to.equal(true);
  });

  it('isDynamic returns true for nested predicates', async () => {
    expect(isDynamic('foo[bar[baz = 1]]')).to.equal(true);
  });

  it('isDynamic returns true for multiple predicates', async () => {
    expect(isDynamic('foo[bar][baz]')).to.equal(true);
  });

  it('isDynamic returns true for predicate with function', async () => {
    expect(isDynamic('foo[string-length(bar) > 0]')).to.equal(true);
  });
});
