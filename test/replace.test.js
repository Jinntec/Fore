import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';
import * as fx from "fontoxpath";

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
          <fx-inspector open></fx-inspector>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const inst = el
        .getModel()
        .getDefaultInstance()
        .getDefaultContext();
    const initial = fx.evaluateXPath('//value',inst);
    expect(initial).to.exist;

    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const replaced = fx.evaluateXPath('list', inst, null, {});
    expect(replaced).to.exist;
    const values = fx.evaluateXPathToNodes('list/value', inst, null, {});
    expect(values.length).to.equal(3);
    // console.log('instance', inst);

/*
    expect(control.value).to.equal('A');
    expect(control.getModelItem().value).to.equal('A');

    control.value = 'B';
    expect(control.value).to.equal('B');
    control.setValue('B'); // mutate model by triggering modelItem change

    expect(control.value).to.equal('B');
    expect(control.getModelItem().value).to.equal('B');
*/
  });

});
