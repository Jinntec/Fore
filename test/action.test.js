/* eslint-disable no-unused-expressions */
import {html, fixture, fixtureSync, expect, elementUpdated, oneEvent} from '@open-wc/testing';

import '../src/fx-instance.js';
import '../src/ui/fx-container.js';
import '../src/fx-bind.js';

describe('action Tests', () => {
  it('setvalue action of control works and triggers update', async () => {
    const el = await fixtureSync(html`
      <fx-form>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <value>A</value>
            </data>
          </fx-instance>
        </fx-model>
        
        <fx-control ref="value"></fx-control>
      </fx-form>
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
      <fx-form>
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
            <fx-setvalue ref="value" value="B"></fx-setvalue>
        </fx-trigger>
        
      </fx-form>
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

  it('falsy condition prevents performing the action', async () => {
    const el = await fixtureSync(html`
      <fx-form>
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
            <fx-setvalue if="../confirmation='true'" ref="value" value="B"></fx-setvalue>
        </fx-trigger>
        
      </fx-form>
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
      <fx-form>
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
            <fx-setvalue if="../confirmation='true'" ref="value" value="B"></fx-setvalue>
        </fx-trigger>
        
      </fx-form>
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

});
