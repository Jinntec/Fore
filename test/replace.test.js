import {
  html, fixtureSync, expect, oneEvent,
} from '@open-wc/testing';

import '../index.js';
import * as fx from 'fontoxpath';

describe('replace Tests', () => {
  it('replaces a node with one from another instance', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <value>A</value>
            </data>
          </fx-instance>
          <fx-instance id="template">
            <data>
              <list>
                <value>A</value>
                <value>B</value>
                <value>C</value>
              </list>
            </data>
          </fx-instance>
        </fx-model>

        <fx-trigger id="trigger">
          <button>replace</button>
          <fx-replace ref="value" with="instance('template')/list"></fx-replace>
        </fx-trigger>
        <fx-repeat ref="list/value">
          <template>
            <fx-control ref="."></fx-control>
          </template>
        </fx-repeat>
        <fx-inspector open></fx-inspector>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const inst = el
      .getModel()
      .getDefaultInstance()
      .getDefaultContext();
    const initial = fx.evaluateXPath('//value', inst);
    expect(initial).to.exist;

    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    const replaced = fx.evaluateXPath('list', inst, null, {});
    expect(replaced).to.exist;
    const values = fx.evaluateXPathToNodes('list/value', inst, null, {});
    expect(values.length).to.equal(3);
    expect(values[0].outerHTML).to.equal('<value>A</value>');
    expect(values[1].outerHTML).to.equal('<value>B</value>');
    expect(values[2].outerHTML).to.equal('<value>C</value>');
    console.log('values', values);
  });

  it('replaces an attribute with one from another location', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <value attr="">A</value>
              <with replaced="foo"></with>
            </data>
          </fx-instance>
        </fx-model>

        <fx-trigger id="trigger">
          <button>replace</button>
          <fx-replace ref="value/@attr" with="//with/@replaced"></fx-replace>
        </fx-trigger>
        <fx-inspector open></fx-inspector>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const inst = el
      .getModel()
      .getDefaultInstance()
      .getDefaultContext();
    const initial = fx.evaluateXPath('//value', inst);
    expect(initial).to.exist;

    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    const replaced = fx.evaluateXPath('//value/@replaced', inst, null, {});
    expect(replaced).to.exist;
    console.log('replaced', replaced);
    console.log('replaced inst', inst);
    expect(replaced).to.equal('foo');
  });
});
