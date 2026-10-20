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
          <fx-instance
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
            src="/base/test/empty-document.xml"
          >
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
          <fx-instance
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
            src="/base/test/empty-document.xml"
          >
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
          <fx-instance
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
            src="/base/test/empty-document.xml"
          >
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
          <fx-instance
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
            src="/base/test/empty-document.xml"
          >
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

/**
 * All anonymous `<fx-instance data-src="...">` created for `data-src` lookups.
 */
function getDataSrcInstances(el) {
  const model = el.querySelector('fx-model');
  return Array.from(model.children).filter(
    n => n.localName === 'fx-instance' && n.hasAttribute('data-src'),
  );
}

const optionTexts = el =>
  Array.from(el.querySelectorAll('select option')).map(o => o.textContent.trim());

describe('fx-control data-src with JSON and {...} templates', () => {
  it('loads a JSON document with data-type="json" and binds it as $src', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance src="/base/test/empty-document.xml"></fx-instance>
        </fx-model>
        <fx-control ref=".">
          <select
            class="widget"
            ref="$src?*"
            data-src="/base/test/data-src-lang-de.json"
            data-type="json"
          >
            <template>
              <option value="{?code}">{?name}</option>
            </template>
          </select>
        </fx-control>
      </fx-fore>
    `);

    await waitUntil(() => el.querySelectorAll('select option').length > 0);
    expect(optionTexts(el)).to.deep.equal(['Eins', 'Zwei']);
    expect(el.querySelectorAll('select option')[1].value).to.equal('b');
  });

  it('resolves a {...} template in data-src on the first load', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance src="/base/test/empty-document.xml"></fx-instance>
          <fx-instance id="i18n" type="json">{"lang": "en"}</fx-instance>
        </fx-model>
        <fx-control ref=".">
          <select
            class="widget"
            ref="$src?*"
            data-src="/base/test/data-src-lang-{instance('i18n')?lang}.json"
            data-type="json"
          >
            <template>
              <option value="{?code}">{?name}</option>
            </template>
          </select>
        </fx-control>
      </fx-fore>
    `);

    await waitUntil(() => el.querySelectorAll('select option').length > 0);
    expect(optionTexts(el)).to.deep.equal(['One', 'Two']);
    // only the resolved URL was requested: no instance for the raw template
    const instances = getDataSrcInstances(el);
    expect(instances.length).to.equal(1);
    expect(instances[0].getAttribute('src')).to.equal('/base/test/data-src-lang-en.json');
  });

  it('loads the new URL when the template result changes (instance replaced by a submission), and reuses the instance when it changes back', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance src="/base/test/empty-document.xml"></fx-instance>
          <fx-instance id="i18n" type="json">{"lang": "de"}</fx-instance>
          <fx-submission
            id="s-en"
            method="get"
            serialization="none"
            replace="instance"
            instance="i18n"
            url="/base/test/data-src-ctl-en.json"
          ></fx-submission>
          <fx-submission
            id="s-de"
            method="get"
            serialization="none"
            replace="instance"
            instance="i18n"
            url="/base/test/data-src-ctl-de.json"
          ></fx-submission>
        </fx-model>
        <fx-trigger id="to-en"><button>en</button><fx-send submission="s-en"></fx-send></fx-trigger>
        <fx-trigger id="to-de"><button>de</button><fx-send submission="s-de"></fx-send></fx-trigger>
        <fx-control ref=".">
          <select
            class="widget"
            ref="$src?*"
            data-src="/base/test/data-src-lang-{instance('i18n')?lang}.json"
            data-type="json"
          >
            <template>
              <option value="{?code}">{?name}</option>
            </template>
          </select>
        </fx-control>
      </fx-fore>
    `);

    await waitUntil(() => optionTexts(el).join() === 'Eins,Zwei');

    el.querySelector('#to-en button').click();
    await waitUntil(() => optionTexts(el).join() === 'One,Two');
    expect(getDataSrcInstances(el).length).to.equal(2);

    el.querySelector('#to-de button').click();
    await waitUntil(() => optionTexts(el).join() === 'Eins,Zwei');
    // back to an URL that was loaded before: the cached instance is used, no third one is created
    expect(getDataSrcInstances(el).length).to.equal(2);
  });

  it('does not request anything while the template can not be resolved', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance src="/base/test/empty-document.xml"></fx-instance>
        </fx-model>
        <fx-control ref=".">
          <select
            class="widget"
            ref="$src?*"
            data-src="/base/test/data-src-lang-{instance('missing')?lang}.json"
            data-type="json"
          >
            <template>
              <option value="{?code}">{?name}</option>
            </template>
          </select>
        </fx-control>
      </fx-fore>
    `);

    await new Promise(resolve => setTimeout(resolve, 500));
    expect(getDataSrcInstances(el).length).to.equal(0);
    expect(el.querySelectorAll('select option').length).to.equal(0);
  });

  it('builds the options of a static select once, and again only when the data-src URL changes', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance src="/base/test/empty-document.xml"></fx-instance>
          <fx-instance id="i18n" type="json">{"lang": "de"}</fx-instance>
          <fx-submission
            id="s-en"
            method="get"
            serialization="none"
            replace="instance"
            instance="i18n"
            url="/base/test/data-src-ctl-en.json"
          ></fx-submission>
        </fx-model>
        <fx-trigger id="to-en"><button>en</button><fx-send submission="s-en"></fx-send></fx-trigger>
        <fx-control ref=".">
          <select
            class="widget"
            static
            ref="$src?*"
            data-src="/base/test/data-src-lang-{instance('i18n')?lang}.json"
            data-type="json"
          >
            <template>
              <option value="{?code}">{?name}</option>
            </template>
          </select>
        </fx-control>
      </fx-fore>
    `);

    await waitUntil(() => optionTexts(el).join() === 'Eins,Zwei');
    const before = Array.from(el.querySelectorAll('select option'));

    // a forced refresh does not rebuild a static select
    await el.refresh(true);
    expect(Array.from(el.querySelectorAll('select option'))).to.deep.equal(before);

    // a different data-src URL does
    el.querySelector('#to-en button').click();
    await waitUntil(() => optionTexts(el).join() === 'One,Two');
    expect(el.querySelectorAll('select option')[0]).to.not.equal(before[0]);
  });
});
