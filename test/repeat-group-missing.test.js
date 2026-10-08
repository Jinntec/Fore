/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

const NS = 'urn:test:c';

const fixtureFor = src =>
  fixtureSync(html`
    <fx-fore xmlns:c="urn:test:c" create-nodes="create-nodes">
      <fx-model>
        <fx-instance src="${src}"></fx-instance>
      </fx-model>
      <fx-repeat id="r" ref="c:line">
        <template>
          <fx-control ref="c:id"><input type="text" /></fx-control>
          <fx-group id="self" ref=".">
            <fx-control ref="c:extra"><input type="text" /></fx-control>
          </fx-group>
          <fx-group id="price" ref="c:price" on-demand="true">
            <fx-control ref="c:amount"><input type="text" /></fx-control>
            <fx-control ref="c:base"><input type="text" /></fx-control>
            <fx-control ref="c:base/@unit"><input type="text" /></fx-control>
          </fx-group>
        </template>
      </fx-repeat>
    </fx-fore>
  `);

const root = el => el.getModel().instances[0].instanceData.documentElement;

describe('create-nodes: group with a missing element inside a repeat item', () => {
  it('creates the group element in the line, not its children in the root', async () => {
    const el = fixtureFor('/base/test/data/repeat-group-missing.xml');
    await oneEvent(el, 'ready');

    const rootKids = Array.from(root(el).children).map(c => c.localName);
    expect(rootKids, 'no stray nodes in the root').to.deep.equal(['line']);

    const line = root(el).children[0];
    const price = Array.from(line.children).find(c => c.localName === 'price');
    expect(price, 'c:price is created inside the line').to.exist;
    expect(price.namespaceURI).to.equal(NS);
    expect(Array.from(price.children).map(c => c.localName)).to.include.members(['amount', 'base']);
    expect(price.querySelector('base').hasAttribute('unit')).to.be.true;
  });
});

describe('create-nodes: same content loaded via fx-include (lazy section)', () => {
  it('creates the group element in the line, not its children in the root', async () => {
    const el = fixtureSync(html`
      <fx-fore xmlns:c="urn:test:c" create-nodes="create-nodes">
        <fx-model>
          <fx-instance src="/base/test/data/repeat-group-missing.xml"></fx-instance>
        </fx-model>
        <fx-include immediate>
          <template>
            <fx-repeat id="r" ref="c:line">
              <template>
                <fx-control ref="c:id"><input type="text" /></fx-control>
                <fx-group id="self" ref=".">
                  <fx-control ref="c:extra"><input type="text" /></fx-control>
                </fx-group>
                <fx-group id="price" ref="c:price" on-demand="true">
                  <fx-control ref="c:amount"><input type="text" /></fx-control>
                  <fx-control ref="c:base"><input type="text" /></fx-control>
                  <fx-control ref="c:base/@unit"><input type="text" /></fx-control>
                </fx-group>
              </template>
            </fx-repeat>
          </template>
        </fx-include>
      </fx-fore>
    `);
    const include = el.querySelector('fx-include');
    const includeDone = oneEvent(include, 'include-done');
    await oneEvent(el, 'ready');
    await includeDone;

    const rootKids = Array.from(root(el).children).map(c => c.localName);
    expect(rootKids, 'no stray nodes in the root').to.deep.equal(['line']);
    const line = root(el).children[0];
    const price = Array.from(line.children).find(c => c.localName === 'price');
    expect(price, 'c:price is created inside the line').to.exist;
    expect(price.querySelector('base').hasAttribute('unit')).to.be.true;
  });
});
