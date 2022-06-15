import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import {XPathUtil} from '../src/xpath-util.js';

describe('XPathUtil Tests', () => {
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
});
