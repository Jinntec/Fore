/* eslint-disable no-unused-expressions */
import {
  html, fixtureSync, expect, oneEvent,
} from '@open-wc/testing';

import '../index.js';

describe('trigger tests', () => {
  it('disables trigger when in readonly state', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <disabled>true</disabled>
            </data>
          </fx-instance>
          <fx-bind ref="disabled" readonly="true()"></fx-bind>
        </fx-model>
        <fx-trigger ref="disabled">
          <button>I'm a button</button>
          <fx-message class="action">Hi from button</fx-message>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    expect(trigger).to.exist;
    expect(trigger.hasAttribute('readonly')).to.be.true;

    const widget = trigger.firstElementChild;
    expect(widget).to.exist;
    expect(widget.hasAttribute('readonly')).to.be.true;
    expect(widget.hasAttribute('disabled')).to.be.true;
  });

  it('toggles readonly state off', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <disabled>true</disabled>
            </data>
          </fx-instance>
          <fx-bind ref="disabled" readonly=".='true'"></fx-bind>
        </fx-model>
        <fx-trigger ref="disabled">
          <button>I'm a button</button>
          <fx-message class="action">Hi from button</fx-message>
        </fx-trigger>

        <fx-trigger id="enable">
          <button>enabling...</button>
          <fx-setvalue id="senable" ref="disabled">false</fx-setvalue>
        </fx-trigger>

      </fx-fore>
    `);

    // await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    expect(trigger).to.exist;

    const enable = document.getElementById('enable');
    await enable.performActions();

    expect(trigger.hasAttribute('readonly')).to.be.false;
  });

  it('toggles readonly state on', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <disabled>false</disabled>
            </data>
          </fx-instance>
          <fx-bind ref="disabled" readonly=".='true'"></fx-bind>
          <fx-setvalue event="model-construct-done" ref="disabled">true</fx-setvalue>
        </fx-model>
        <fx-trigger ref="disabled">
          <button>I'm a button</button>
          <fx-message class="action">Hi from button</fx-message>
        </fx-trigger>

        <fx-trigger id="setReadonly">
          <button>set to readonly...</button>
          <fx-setvalue id="readonly" ref="disabled">true</fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    const trigger = el.querySelector('fx-trigger');
    expect(trigger).to.exist;
    await oneEvent(el, 'refresh-done');

	  await el.querySelector('#setReadonly').performActions();

    expect(trigger.hasAttribute('readonly')).to.be.true;
  });
});
