/* eslint-disable no-unused-expressions */
import {
  html, fixtureSync, expect, elementUpdated,
} from '@open-wc/testing';

import '../index.js';
import * as fx from 'fontoxpath';

describe('setvalue tests', () => {
  it('creates modelItem during refresh', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting>Hello World!</greeting>
            </data>
          </fx-instance>
        </fx-model>

        <fx-group>
          <fx-output id="output" ref="greeting[true()]"></fx-output>
          <fx-trigger id="btn" label="say 'hello Universe'">
            <fx-setvalue ref="greeting">Hello Universe</fx-setvalue>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);
    const model = el.querySelector('fx-model');

    await elementUpdated(model);
    expect(model.modelItems.length).to.equal(1);

    const inst = model.getDefaultInstance().getDefaultContext();
    const xp = fx.evaluateXPath('greeting', inst, null, {});
    console.log('plain eval: ', xp);

    const btn = el.querySelector('#btn');
    await btn.performActions();

    const out = el.querySelector('#output');
    expect(out.modelItem.value).to.equal('Hello Universe');
  });

  it('ignores setvalue actions with do not bind to a existing node', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting>Hello World!</greeting>
            </data>
          </fx-instance>
        </fx-model>

        <fx-group>
          <fx-output id="output" ref="greeting"></fx-output>
          <fx-trigger id="btn" label="say 'hello Universe'">
            <fx-setvalue ref="foo">Hello Universe</fx-setvalue>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);
    const model = el.querySelector('fx-model');

    await elementUpdated(model);
    expect(model.modelItems.length).to.equal(1);

    const inst = model.getDefaultInstance().getDefaultContext();
    const xp = fx.evaluateXPath('greeting', inst, null, {});
    console.log('plain eval: ', xp);

    const btn = el.querySelector('#btn');
    await btn.performActions();

    const out = el.querySelector('#output');
    expect(out.modelItem.value).to.equal('Hello World!');
  });

  it('uses element content instead of "value" attr if present', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting>Hello World!</greeting>
            </data>
          </fx-instance>
        </fx-model>

        <fx-group>
          <fx-output id="output" ref="greeting"></fx-output>
          <fx-trigger id="btn" label="say 'hello Universe'">
            <fx-setvalue ref="greeting">Hello Universe</fx-setvalue>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);
    const model = el.querySelector('fx-model');

    await elementUpdated(model);
    expect(model.modelItems.length).to.equal(1);

    const inst = model.getDefaultInstance().getDefaultContext();
    const xp = fx.evaluateXPath('greeting', inst, null, {});
    console.log('plain eval: ', xp);

    const btn = el.querySelector('#btn');
    await btn.performActions();

    const out = el.querySelector('#output');
    expect(out.modelItem.value).to.equal('Hello Universe');
  });

  it('defaults to empty string if neither value nor textContent are present', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting>Hello World!</greeting>
            </data>
          </fx-instance>
        </fx-model>

        <fx-group>
          <fx-output id="output" ref="greeting"></fx-output>
          <fx-trigger id="btn" label="say 'hello Universe'">
            <fx-setvalue ref="greeting"></fx-setvalue>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);
    const model = el.querySelector('fx-model');

    await elementUpdated(model);
    expect(model.modelItems.length).to.equal(1);

    const inst = model.getDefaultInstance().getDefaultContext();
    const xp = fx.evaluateXPath('greeting', inst, null, {});
    console.log('plain eval: ', xp);

    const btn = el.querySelector('#btn');
    await btn.performActions();

    const out = el.querySelector('#output');
    expect(out.modelItem.value).to.equal('');
  });
});
