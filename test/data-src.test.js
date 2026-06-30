/* eslint-disable no-unused-expressions */
import { html, fixture, expect, waitUntil } from '@open-wc/testing';

import '../index.js';

/**
 * The anonymous `<fx-instance data-src="...">` created by fx-control for a
 * `data-src` lookup variable. Used to wait for the lazy load to complete
 * (its `xpath-default-namespace` is only set once the document has loaded).
 */
function getDataSrcInstance(el) {
  const model = el.querySelector('fx-model');
  return Array.from(model.children).find(
    n => n.localName === 'fx-instance' && n.getAttribute('data-src'),
  );
}

describe('fx-control data-src lookup variable', () => {
  it('derives the xpath default namespace for $src from the loaded data-src document', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance xpath-default-namespace="http://www.tei-c.org/ns/1.0">
            <data><item>x</item></data>
          </fx-instance>
        </fx-model>
        <fx-control ref=".">
          <select class="widget" ref="$src//category" data-src="/base/test/data-src-categories.xml">
            <template>
              <option value="{@corresp}">{.}</option>
            </template>
          </select>
        </fx-control>
      </fx-fore>
    `);

    await waitUntil(() => el.querySelectorAll('select option').length > 0);

    const options = el.querySelectorAll('select option');
    expect(options.length).to.equal(2);
    expect(options[0].value).to.equal('a');
    expect(options[0].textContent.trim()).to.equal('Alpha');
    expect(options[1].value).to.equal('b');
    expect(options[1].textContent.trim()).to.equal('Beta');

    expect(getDataSrcInstance(el).getAttribute('xpath-default-namespace')).to.equal(
      'http://example.org/categories',
    );
  });

  it('supports a custom variable name via data-id', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance xpath-default-namespace="http://www.tei-c.org/ns/1.0">
            <data><item>x</item></data>
          </fx-instance>
        </fx-model>
        <fx-control ref=".">
          <select
            class="widget"
            ref="$material//category"
            data-src="/base/test/data-src-categories.xml"
            data-id="material"
          >
            <template>
              <option value="{@corresp}">{.}</option>
            </template>
          </select>
        </fx-control>
      </fx-fore>
    `);

    await waitUntil(() => el.querySelectorAll('select option').length > 0);

    const options = el.querySelectorAll('select option');
    expect(options.length).to.equal(2);
    expect(options[0].value).to.equal('a');
    expect(options[1].value).to.equal('b');
  });

  it('yields no matches when the lookup document’s root namespace differs from its target elements and no override is given', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance xpath-default-namespace="http://www.tei-c.org/ns/1.0">
            <data><item>x</item></data>
          </fx-instance>
        </fx-model>
        <fx-control ref=".">
          <select class="widget" ref="$src//category" data-src="/base/test/data-src-mixed-ns.xml">
            <template>
              <option value="{@corresp}">{.}</option>
            </template>
          </select>
        </fx-control>
      </fx-fore>
    `);

    await waitUntil(() => !!getDataSrcInstance(el)?.hasAttribute('xpath-default-namespace'));

    expect(getDataSrcInstance(el).getAttribute('xpath-default-namespace')).to.equal(
      'http://example.org/root',
    );
    expect(el.querySelectorAll('select option').length).to.equal(0);
  });

  it('uses the data-xpath-ns override when the lookup document’s root namespace differs from its target elements', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance xpath-default-namespace="http://www.tei-c.org/ns/1.0">
            <data><item>x</item></data>
          </fx-instance>
        </fx-model>
        <fx-control ref=".">
          <select
            class="widget"
            ref="$src//category"
            data-src="/base/test/data-src-mixed-ns.xml"
            data-xpath-ns="http://example.org/categories"
          >
            <template>
              <option value="{@corresp}">{.}</option>
            </template>
          </select>
        </fx-control>
      </fx-fore>
    `);

    await waitUntil(() => el.querySelectorAll('select option').length > 0);

    const options = el.querySelectorAll('select option');
    expect(options.length).to.equal(2);
    expect(options[0].value).to.equal('x');
    expect(options[1].value).to.equal('y');

    expect(getDataSrcInstance(el).getAttribute('xpath-default-namespace')).to.equal(
      'http://example.org/categories',
    );
  });
});
