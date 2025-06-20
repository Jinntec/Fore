import { expect } from 'chai';
import { XPathUtil } from '../src/xpath-util.js'; // assuming isDynamic is a static method of XPathUtil

describe.only('isDynamic', () => {
  it('returns false for string literal', () => {
    expect(XPathUtil.isDynamic("'hello'")).to.equal(false);
  });

  it('returns false for numeric literal', () => {
    expect(XPathUtil.isDynamic('42')).to.equal(false);
  });

  it('returns false for boolean literal true()', () => {
    expect(XPathUtil.isDynamic('true()')).to.equal(false);
  });

  it('returns false for function with static args', () => {
    expect(XPathUtil.isDynamic("concat('a', 'b')")).to.equal(false);
  });

  it('returns false for logical expression with string literals', () => {
    expect(XPathUtil.isDynamic("'foo' or 'bar'")).to.equal(false);
  });

  it('returns true for simple location path', () => {
    expect(XPathUtil.isDynamic('/data/item')).to.equal(true);
  });

  it('returns true for relative path with predicate', () => {
    expect(XPathUtil.isDynamic("item[@active='true']")).to.equal(true);
  });

  it('returns true for path with multiple predicates', () => {
    expect(XPathUtil.isDynamic("item[@active='true'][position() < 3]")).to.equal(true);
  });

  it('returns true for variable reference', () => {
    expect(XPathUtil.isDynamic('$x')).to.equal(true);
  });

  it('returns true for path with nested expression', () => {
    expect(XPathUtil.isDynamic('items[item/@price > 10]')).to.equal(true);
  });

  it('returns true for arithmetic using paths', () => {
    expect(XPathUtil.isDynamic('price * 1.2')).to.equal(true);
  });

  it('returns true for XPath function depending on data', () => {
    expect(XPathUtil.isDynamic('count(//item)')).to.equal(true);
  });

  it('returns true for mixed static and dynamic in logical expression', () => {
    expect(XPathUtil.isDynamic("'foo' or dateTime()")).to.equal(true);
  });

  it('returns true for current-date()', () => {
    expect(XPathUtil.isDynamic('current-date()')).to.equal(true);
  });

  it('returns true for "index()" function call', () => {
    expect(XPathUtil.isDynamic('index("foo")')).to.equal(true);
  });

  it('returns true for deeply nested predicate expression', () => {
    expect(XPathUtil.isDynamic('catalog/item[price[. > 10]]')).to.equal(true);
  });
  it('isDynamic returns true for path with literal predicate', async () => {
    expect(XPathUtil.isDynamic('foo[1]')).to.equal(true);
  });

  it('isDynamic returns true for path with boolean predicate', async () => {
    expect(XPathUtil.isDynamic('foo[true()]')).to.equal(true);
  });

  it('isDynamic returns true for path with location predicate', async () => {
    expect(XPathUtil.isDynamic('foo[bar]')).to.equal(true);
  });

  it('isDynamic returns true for nested predicates', async () => {
    expect(XPathUtil.isDynamic('foo[bar[baz = 1]]')).to.equal(true);
  });

  it('isDynamic returns true for multiple predicates', async () => {
    expect(XPathUtil.isDynamic('foo[bar][baz]')).to.equal(true);
  });

  it('isDynamic returns true for predicate with function', async () => {
    expect(XPathUtil.isDynamic('foo[string-length(bar) > 0]')).to.equal(true);
  });
});
