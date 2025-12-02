import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';
import { isDynamic } from '../src/xpath-path.js';

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
