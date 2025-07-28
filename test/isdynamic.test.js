import { expect } from '@open-wc/testing';
import { isDynamic } from '../src/xpath-path'; // assuming isDynamic is a static method of XPathUtil

describe.skip('isDynamic', () => {
  it('returns false for string literal', () => {
    expect(isDynamic("'hello'")).to.equal(false);
  });

  it('returns false for numeric literal', () => {
    expect(isDynamic('42')).to.equal(false);
  });

  it('returns false for boolean literal true()', () => {
    expect(isDynamic('true()')).to.equal(false);
  });

  it('returns false for function with static args', () => {
    expect(isDynamic("concat('a', 'b')")).to.equal(false);
  });

  it('returns false for logical expression with string literals', () => {
    expect(isDynamic("'foo' or 'bar'")).to.equal(false);
  });

  it('returns true for simple location path', () => {
    expect(isDynamic('/data/item')).to.equal(true);
  });

  it('returns true for relative path with predicate', () => {
    expect(isDynamic("item[@active='true']")).to.equal(true);
  });

  it('returns true for path with multiple predicates', () => {
    expect(isDynamic("item[@active='true'][position() < 3]")).to.equal(true);
  });

  it('returns true for variable reference', () => {
    expect(isDynamic('$x')).to.equal(true);
  });

  it('returns true for path with nested expression', () => {
    expect(isDynamic('items[item/@price > 10]')).to.equal(true);
  });

  it('returns true for arithmetic using paths', () => {
    expect(isDynamic('price * 1.2')).to.equal(true);
  });

  it('returns true for XPath function depending on data', () => {
    expect(isDynamic('count(//item)')).to.equal(true);
  });

  it('returns true for mixed static and dynamic in logical expression', () => {
    expect(isDynamic("'foo' or dateTime()")).to.equal(true);
  });

  it('returns true for current-date()', () => {
    expect(isDynamic('current-date()')).to.equal(true);
  });

  it('returns true for "index()" function call', () => {
    expect(isDynamic('index("foo")')).to.equal(true);
  });

  it('returns true for deeply nested predicate expression', () => {
    expect(isDynamic('catalog/item[price[. > 10]]')).to.equal(true);
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
