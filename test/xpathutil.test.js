import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import { XPathUtil } from '../src/xpath-util.js';

describe.only('XPathUtil Tests', () => {
  it('returns "default" if call without args', async () => {
    expect(XPathUtil.getInstanceId('instance()')).to.equal('default');
  });
  it('returns "default" if arg is "default"', async () => {
    expect(XPathUtil.getInstanceId("instance('default')")).to.equal('default');
  });
  it('returns "foo" if arg is "foo"', async () => {
    expect(XPathUtil.getInstanceId("instance('foo')")).to.equal('foo');
  });

  it('isAbsolutePath returns false when no path is given', async () => {
    expect(XPathUtil.isAbsolutePath('')).to.equal(false);
  });
  it('isAbsolutePath returns false when path is starting at context node', async () => {
    expect(XPathUtil.isAbsolutePath('./')).to.equal(false);
  });
  it('isAbsolutePath returns false when path is arbritrary step expr', async () => {
    expect(XPathUtil.isAbsolutePath('foo')).to.equal(false);
  });
  it('isAbsolutePath returns true when no path starts with "/"', async () => {
    expect(XPathUtil.isAbsolutePath('/foo')).to.equal(true);
  });
  it('isAbsolutePath returns true when no path starts with "instance("', async () => {
    expect(XPathUtil.isAbsolutePath('instance()')).to.equal(true);
  });

  it('returns correct parentBindElement', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <counter>0</counter>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group ref="outer" id="outer">
          <fx-control ref="inner" id="inner">
            <fx-setvalue ref="other"></fx-setvalue>
          </fx-control>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const outer = el.querySelector('#outer');
    expect(XPathUtil.getParentBindingElement(outer)).to.equal(null);
    const inner = el.querySelector('#inner');
    expect(XPathUtil.getParentBindingElement(inner)).to.equal(outer);
    const action = el.querySelector('fx-setvalue');
    expect(XPathUtil.getParentBindingElement(action)).to.equal(inner);
  });

  it('isDymanic returns true for "index" func', async () => {
    expect(XPathUtil.isDynamic('index("foo")')).to.equal(true);
  });
  it('isDymanic returns true for "instance()" func', async () => {
    expect(XPathUtil.isDynamic('instance()')).to.equal(true);
  });
  it('isDymanic returns true for "context()" func', async () => {
    expect(XPathUtil.isDynamic('context()/foo')).to.equal(true);
  });
  it('isDymanic returns true for any func', async () => {
    expect(XPathUtil.isDynamic('myfunc()')).to.equal(true);
  });
  it('isDymanic returns true for any func with args', async () => {
    expect(XPathUtil.isDynamic('myfunc("foo","bar")')).to.equal(true);
  });
  it('isDymanic returns true for any func with locationpath args', async () => {
    expect(XPathUtil.isDynamic('myfunc(foo/bar, //bar)')).to.equal(true);
  });
  it('isDymanic returns true for any func with variable as arg', async () => {
    expect(XPathUtil.isDynamic('myfunc($var,"bar")')).to.equal(true);
  });
  it('isDymanic returns true for a var', async () => {
    expect(XPathUtil.isDynamic('$var')).to.equal(true);
  });
  it('isDymanic returns true for some text and a var', async () => {
    expect(XPathUtil.isDynamic('"some text" || $var')).to.equal(true);
  });
  it('isDymanic returns false for some text', async () => {
    expect(XPathUtil.isDynamic('"some text"')).to.equal(false);
  });
  it('isDymanic returns false for some concatenated text', async () => {
    expect(XPathUtil.isDynamic('"some text" || ""')).to.equal(false);
  });
  it('isDymanic returns false for some concatenated text using concat', async () => {
    expect(XPathUtil.isDynamic('concat("some concatted"," text")')).to.equal(false);
  });
  it('isDymanic returns false for string-length on fixed string', async () => {
    expect(XPathUtil.isDynamic('string-length("some concatted")')).to.equal(false);
  });
  it('isDymanic returns true for string-length on locationpath', async () => {
    expect(XPathUtil.isDynamic('string-length(foo)')).to.equal(true);
  });
  it('isDymanic returns true for pathes with predicates', async () => {
    expect(XPathUtil.isDynamic('foo[true]')).to.equal(true);
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
