/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('fx-insertchild creating an element by name', () => {
  const section = el => el.getModel().getDefaultInstance().getDefaultContext().querySelector('section');
  const names = el => Array.from(section(el).children).map(c => c.localName);

  async function click(el) {
    el.querySelector('#go').click();
    await oneEvent(el, 'refresh-done');
  }

  it('appends a new empty element as the last child by default', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data><section><old></old></section></data>
          </fx-instance>
        </fx-model>
        <fx-trigger>
          <button id="go">go</button>
          <fx-insertchild parent="section" child="added"></fx-insertchild>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    await click(el);

    expect(names(el)).to.deep.equal(['old', 'added']);
    expect(section(el).lastElementChild.childNodes.length).to.equal(0);
  });

  it('puts the element first with position="first"', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data><section><old></old></section></data>
          </fx-instance>
        </fx-model>
        <fx-trigger>
          <button id="go">go</button>
          <fx-insertchild parent="section" child="added" position="first"></fx-insertchild>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    await click(el);

    expect(names(el)).to.deep.equal(['added', 'old']);
  });

  it('computes the name from {...} templates in the current repeat item', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <section><old></old></section>
              <names><n>alpha</n><n>beta</n></names>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat ref="names/n">
          <template>
            <fx-trigger>
              <button class="pick">{.}</button>
              <fx-insertchild parent="instance()/section" child="made-{.}"></fx-insertchild>
            </fx-trigger>
          </template>
        </fx-repeat>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    el.querySelectorAll('.pick')[1].click();
    await oneEvent(el, 'refresh-done');

    expect(names(el)).to.deep.equal(['old', 'made-beta']);
  });

  it('gives the new element the namespace of its parent', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="xml" src="/base/test/ns-page.xml"></fx-instance>
        </fx-model>
        <fx-trigger>
          <button id="go">go</button>
          <fx-insertchild parent="*:body" child="div"></fx-insertchild>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    await click(el);

    const body = el.getModel().getDefaultInstance().getDefaultContext().querySelector('body');
    expect(body.lastElementChild.localName).to.equal('div');
    expect(body.lastElementChild.namespaceURI).to.equal('http://www.w3.org/1999/xhtml');
  });

  it('reports an error for an invalid element name and inserts nothing', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data><section><old></old></section></data>
          </fx-instance>
        </fx-model>
        <fx-trigger>
          <button id="go">go</button>
          <fx-insertchild parent="section" child="not valid"></fx-insertchild>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    const error = oneEvent(el.querySelector('fx-insertchild'), 'error');
    el.querySelector('#go').click();
    const { detail } = await error;

    expect(detail.message).to.contain('not a valid element name');
    expect(names(el)).to.deep.equal(['old']);
  });

  it('refuses to insert into an HTML template element instead of losing the child', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="xml" src="/base/test/ns-page.xml"></fx-instance>
        </fx-model>
        <fx-trigger>
          <button id="go">go</button>
          <fx-insertchild parent="*:body/*:template" child="div"></fx-insertchild>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    const error = oneEvent(el.querySelector('fx-insertchild'), 'error');
    el.querySelector('#go').click();
    const { detail } = await error;

    expect(detail.message).to.contain('<template>');
  });
});
