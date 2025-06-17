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
  it('isDymanic returns true for any func', async () => {
    expect(XPathUtil.isDynamic('myfunc()')).to.equal(true);
  });
  it('isDymanic returns true for any func with args', async () => {
    expect(XPathUtil.isDynamic('myfunc("foo","bar")')).to.equal(true);
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
});
