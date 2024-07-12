import {
  html, fixtureSync, expect, oneEvent,
} from '@open-wc/testing';

import '../src/fx-instance.js';
import '../src/ui/fx-container.js';
import '../src/fx-bind.js';
import * as fx from 'fontoxpath';

describe('Event Tests', () => {
  it('passes event detail object', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-action event="custom">
          <fx-setvalue ref="param1" value="event('param1')"></fx-setvalue>
          <fx-setvalue ref="param2" value="event('param2')"></fx-setvalue>
        </fx-action>

        <fx-model>
          <fx-instance>
            <data>
              <param1></param1>
              <param2></param2>
            </data>
          </fx-instance>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    el.dispatchEvent(
      new CustomEvent('custom', {
        composed: true,
        bubbles: true,
        detail: { param1: 'foo', param2: 'bar' },
      }),
    );
    // await oneEvent(el, 'value-changed');

    const inst = el
      .getModel()
      .getDefaultInstance()
      .getDefaultContext();
    const p1 = fx.evaluateXPathToString('param1', inst, null, {});
    const p2 = fx.evaluateXPathToString('param2', inst, null, {});

    expect(p1).to.equal('foo');
    // ### todo: fails - why?
    // expect(p2).to.equal('bar');
  });

  it('handles bubbling events', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <param1></param1>
              <param2></param2>
            </data>
          </fx-instance>
        </fx-model>

        <!--
                ### bubbling listener
                -->
        <fx-action event="custom">
          <fx-setvalue ref="param1" value="event('param1')"></fx-setvalue>
          <fx-setvalue ref="param2" value="event('param2')"></fx-setvalue>
        </fx-action>
        <button onclick="firecustom(event)">fire custom event from js</button>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    el.dispatchEvent(
      new CustomEvent('custom', {
        composed: true,
        bubbles: true,
        detail: { param1: 'foo', param2: 'bar' },
      }),
    );

	  await oneEvent(el, 'refresh-done');

    const inst = el
      .getModel()
      .getDefaultInstance()
      .getDefaultContext();
    const p1 = fx.evaluateXPathToString('param1', inst, null, {});
    expect(p1).to.equal('foo');
    const p2 = fx.evaluateXPathToString('param2', inst, null, {});
    expect(p2).to.equal('bar');
  });

  it('handles at-target events', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <param1></param1>
              <param2></param2>
            </data>
          </fx-instance>
        </fx-model>

        <!--
                ### bubbling listener
                -->
        <fx-action event="custom" target="target">
          <fx-setvalue ref="param1" value="event('param1')"></fx-setvalue>
          <fx-setvalue ref="param2" value="event('param2')"></fx-setvalue>
        </fx-action>
        <div id="target"></div>
        <button onclick="firecustom(event)">fire custom event from js</button>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const target = document.getElementById('target');
    target.dispatchEvent(
      new CustomEvent('custom', {
        composed: true,
        bubbles: true,
        detail: { param1: 'foo', param2: 'bar' },
      }),
    );

	  	  await oneEvent(el, 'refresh-done');

    const inst = el
      .getModel()
      .getDefaultInstance()
      .getDefaultContext();
    const p1 = fx.evaluateXPathToString('param1', inst, null, {});
    expect(p1).to.equal('foo');
    const p2 = fx.evaluateXPathToString('param2', inst, null, {});
    expect(p2).to.equal('bar');
  });

  it('handles events on document', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <param1></param1>
              <param2></param2>
            </data>
          </fx-instance>
        </fx-model>

        <!--
                ### bubbling listener
                -->
        <fx-action event="custom" target="#document">
          <fx-setvalue ref="param1" value="event('param1')"></fx-setvalue>
          <fx-setvalue ref="param2" value="event('param2')"></fx-setvalue>
        </fx-action>
        <div id="target"></div>
        <button onclick="firecustom(event)">fire custom event from js</button>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    document.dispatchEvent(
      new CustomEvent('custom', {
        composed: true,
        bubbles: true,
        detail: { param1: 'foo', param2: 'bar' },
      }),
    );
	  	  await oneEvent(el, 'refresh-done');

    const inst = el
      .getModel()
      .getDefaultInstance()
      .getDefaultContext();
    const p1 = fx.evaluateXPathToString('param1', inst, null, {});
    expect(p1).to.equal('foo');
    const p2 = fx.evaluateXPathToString('param2', inst, null, {});
    expect(p2).to.equal('bar');
  });

  it('handles bubbling event', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-dispatch targetid="t" name="click" event="model-construct-done"></fx-dispatch>
        <fx-model>
          <fx-instance>
            <data>
              <value></value>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <fx-setvalue ref="value" event="click">group</fx-setvalue>
          <div>
            <fx-setvalue ref="value" event="click">div</fx-setvalue>
            <fx-trigger id="t">
              <button>dispatch click</button>
            </fx-trigger>
          </div>
          <div id="result">{value}</div>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    // const trigger = el.querySelector('fx-trigger');
    // await trigger.performActions();

    const div = el.querySelector('#result');
    expect(div.innerText).to.equal('group');
  });

  it('stops propagation if set to "stop"', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <value></value>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <fx-setvalue ref="value" event="click">group</fx-setvalue>
          <div>
            <fx-setvalue ref="value" event="click" propagate="stop">div</fx-setvalue>
            <fx-trigger id="t">
              <button>dispatch click</button>
            </fx-trigger>
          </div>
          <div id="result">{value}</div>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    // const button = el.querySelector('button');
    // button.click();

    // const trigger = el.querySelector('fx-trigger');
    // await trigger.performActions();
    el.querySelector('button').click();
    await oneEvent(el, 'refresh-done');

    const div = el.querySelector('#result');
    expect(div.innerText).to.equal('div');
  });

  it('makes events fire on "capture" if phase is set to "capture"', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <value></value>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <div>
            <fx-setvalue ref="value" event="click" value="event('eventPhase')" phase="capture"></fx-setvalue>
            <fx-trigger id="t">
              <button>dispatch click</button>
            </fx-trigger>
          </div>
          <div id="result">{value}</div>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    // const button = el.querySelector('button');
    // button.click();

    // const trigger = el.querySelector('fx-trigger');
    // await trigger.performActions();
    el.querySelector('button').click();
    await oneEvent(el, 'refresh-done');

    const div = el.querySelector('#result');
	  // Event phase 1 is 'capture'
    expect(div.innerText).to.equal('1');
  });

	  it('makes events fire on "bubbling" if phase is set to "default"', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <value></value>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <div>
            <fx-setvalue ref="value" event="click" value="event('eventPhase')" phase="default"></fx-setvalue>
            <fx-trigger id="t">
              <button>dispatch click</button>
            </fx-trigger>
          </div>
          <div id="result">{value}</div>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    // const button = el.querySelector('button');
    // button.click();

    // const trigger = el.querySelector('fx-trigger');
    // await trigger.performActions();
    el.querySelector('button').click();
    await oneEvent(el, 'refresh-done');

    const div = el.querySelector('#result');
	  // Event phase 3 is 'bubble'
    expect(div.innerText).to.equal('3');
  });
});
