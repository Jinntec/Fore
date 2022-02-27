import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../src/fx-instance.js';
import '../src/ui/fx-container.js';
import '../src/fx-bind.js';

describe('action Tests', () => {
  it('setvalue action of control works and triggers update', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <value>A</value>
            </data>
          </fx-instance>
        </fx-model>

        <fx-control ref="value"></fx-control>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-control');
    expect(control.value).to.equal('A');
    expect(control.getModelItem().value).to.equal('A');

    control.value = 'B';
    expect(control.value).to.equal('B');
    control.setValue('B'); // mutate model by triggering modelItem change

    expect(control.value).to.equal('B');
    expect(control.getModelItem().value).to.equal('B');
  });

  it('triggers action, executes and updates', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <value>A</value>
            </data>
          </fx-instance>
        </fx-model>

        <fx-control ref="value"></fx-control>
        <fx-trigger>
          <button></button>
          <fx-setvalue ref="value">B</fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-control');
    expect(control.value).to.equal('A');
    expect(control.getModelItem().value).to.equal('A');

    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    expect(control.value).to.equal('B');
    expect(control.getModelItem().value).to.equal('B');
  });

  it('triggers action, evaluates variables, executes and updates', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <value>A</value>
            </data>
          </fx-instance>
        </fx-model>

        <fx-control ref="value"></fx-control>
        <fx-trigger>
          <button></button>
          <fx-var name="my-variable" value="'My variable value'"></fx-var>
          <fx-setvalue ref="value" value="$my-variable"></fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-control');
    expect(control.value).to.equal('A');
    expect(control.getModelItem().value).to.equal('A');

    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    expect(control.value).to.equal('My variable value');
    expect(control.getModelItem().value).to.equal('My variable value');
  });

  it('falsy condition prevents performing the action', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <value>A</value>
              <confirmation>false</confirmation>
            </data>
          </fx-instance>
        </fx-model>

        <fx-control ref="value"></fx-control>
        <fx-trigger>
          <button></button>
          <fx-setvalue if="../confirmation='true'" ref="value">8</fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-control');
    expect(control.value).to.equal('A');
    expect(control.getModelItem().value).to.equal('A');

    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    expect(control.value).to.equal('A');
    expect(control.getModelItem().value).to.equal('A');
  });

  it('truthy condition performs the action', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <value>A</value>
              <confirmation>true</confirmation>
            </data>
          </fx-instance>
        </fx-model>

        <fx-control ref="value"></fx-control>
        <fx-trigger>
          <button></button>
          <fx-setvalue if="../confirmation='true'" ref="value">B</fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-control');
    expect(control.value).to.equal('A');
    expect(control.getModelItem().value).to.equal('A');

    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    expect(control.value).to.equal('B');
    expect(control.getModelItem().value).to.equal('B');
  });

  it('truthy condition performs the action, with variables', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <value>A</value>
              <confirmation>true</confirmation>
            </data>
          </fx-instance>
        </fx-model>

        <fx-control ref="value"></fx-control>
        <fx-trigger>
          <button></button>
          <fx-var name="confirmed" value="confirmation='true'"></fx-var>"
          <fx-setvalue if="$confirmed" ref="value">B</fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-control');
    expect(control.value).to.equal('A');
    expect(control.getModelItem().value).to.equal('A');

    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    expect(control.value).to.equal('B');
    expect(control.getModelItem().value).to.equal('B');
  });

  it('fx-action executes its children', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <value>A</value>
              <confirmation>false</confirmation>
            </data>
          </fx-instance>
        </fx-model>

        <fx-control id="c1" ref="value"></fx-control>
        <fx-control id="c2" ref="confirmation"></fx-control>
        <fx-trigger>
          <button></button>
          <fx-action>
            <fx-setvalue ref="value">B</fx-setvalue>
            <fx-setvalue ref="confirmation">true</fx-setvalue>
          </fx-action>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control1 = el.querySelector('#c1');
    expect(control1.value).to.equal('A');
    expect(control1.getModelItem().value).to.equal('A');

    const control2 = el.querySelector('#c2');
    expect(control2.value).to.equal('false');
    expect(control2.getModelItem().value).to.equal('false');

    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    expect(control1.value).to.equal('B');
    expect(control1.getModelItem().value).to.equal('B');

    expect(control2.value).to.equal('true');
    expect(control2.getModelItem().value).to.equal('true');
  });

  it('fx-action only evaluates variables once', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <value>A</value>
              <previous-value>NIL</previous-value>
            </data>
          </fx-instance>
        </fx-model>

        <fx-control id="c1" ref="value"></fx-control>
        <fx-control id="c2" ref="previous-value"></fx-control>
        <fx-trigger>
          <button></button>
          <fx-action>
            <fx-var name="initial-value" value="xs:string(value)"></fx-var>
            <fx-setvalue ref="value">B</fx-setvalue>
            <fx-setvalue ref="previous-value" value="$initial-value"></fx-setvalue>
          </fx-action>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control1 = el.querySelector('#c1');
    expect(control1.value).to.equal('A');
    expect(control1.getModelItem().value).to.equal('A');

    const control2 = el.querySelector('#c2');
    expect(control2.value).to.equal('NIL');
    expect(control2.getModelItem().value).to.equal('NIL');

    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    expect(control1.value).to.equal('B');
    expect(control1.getModelItem().value).to.equal('B');

    expect(control2.value).to.equal('A');
    expect(control2.getModelItem().value).to.equal('A');
  });

  it('executes while condition is true', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <counter>0</counter>
            </data>
          </fx-instance>
        </fx-model>
        <fx-trigger>
          <button>Count to 10</button>
          <fx-setvalue id="setval" ref="counter" value=".+1" while=". lt 10"></fx-setvalue>
        </fx-trigger>
        <fx-output ref="counter"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const setval = document.getElementById('setval');
    await oneEvent(setval, 'action-performed');

    const control1 = el.querySelector('fx-output');
    expect(control1.value).to.equal('10');
  });

  it('executes while condition is true, with using variables', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <counter>0</counter>
            </data>
          </fx-instance>
        </fx-model>
        <fx-trigger>
          <button>Count to 10</button>
          <fx-var name="steps" value="1"></fx-var>
          <fx-var name="max" value="10"></fx-var>
          <fx-var name="initial" value="xs:integer(counter)"></fx-var>
          <fx-setvalue
            id="setval"
            ref="counter"
            value=". + $steps"
            while=". lt $initial + $max"
          ></fx-setvalue>
        </fx-trigger>
        <fx-output ref="counter"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const setval = document.getElementById('setval');
    await oneEvent(setval, 'action-performed');

    const control1 = el.querySelector('fx-output');
    expect(control1.value).to.equal('10');
  });
});
