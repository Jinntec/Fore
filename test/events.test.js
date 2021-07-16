import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../src/fx-instance.js';
import '../src/ui/fx-container.js';
import '../src/fx-bind.js';
import * as fx from 'fontoxpath';

describe('Event Tests', () => {
  it('passes event detail object', async () => {
    const el = await fixtureSync(html`
      <fx-form>
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
      </fx-form>
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

    expect(p1).to.equal('foo');
  });

  it('handles bubbling events', async () => {
    const el = await fixtureSync(html`
      <fx-form>
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
      </fx-form>
    `);

    await oneEvent(el, 'refresh-done');
    el.dispatchEvent(
      new CustomEvent('custom', {
        composed: true,
        bubbles: true,
        detail: { param1: 'foo', param2: 'bar' },
      }),
    );

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
      <fx-form>
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
      </fx-form>
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
      <fx-form>
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
      </fx-form>
    `);

    await oneEvent(el, 'refresh-done');
    document.dispatchEvent(
      new CustomEvent('custom', {
        composed: true,
        bubbles: true,
        detail: { param1: 'foo', param2: 'bar' },
      }),
    );

    const inst = el
      .getModel()
      .getDefaultInstance()
      .getDefaultContext();
    const p1 = fx.evaluateXPathToString('param1', inst, null, {});
    expect(p1).to.equal('foo');
    const p2 = fx.evaluateXPathToString('param2', inst, null, {});
    expect(p2).to.equal('bar');
  });
});
