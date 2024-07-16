/* eslint-disable no-unused-expressions */
import {
  html, fixture, fixtureSync, expect, elementUpdated, oneEvent,
} from '@open-wc/testing';

import '../index.js';
import { evaluateXPathToNodes } from 'fontoxpath';

describe('delete Tests', () => {
  it('deletes an item and sets index', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
              <task complete="false" due="2019-01-05">third task</task>
              <task complete="false" due="2019-01-06">fourth task</task>
            </data>
          </fx-instance>

          <fx-bind ref="task" readonly="count(../task) lt 3">
            <fx-bind ref="./text()" required="true()"></fx-bind>
            <fx-bind ref="@complete" type="xs:boolean"></fx-bind>
            <fx-bind ref="@due" type="xs:date"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-group>
          <h1>todos</h1>

          <fx-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
            <template>
              <fx-control ref="." id="task" type="text">
                <label>Task</label>
              </fx-control>
              <fx-trigger>
                <fx-delete ref="."></fx-delete>
              </fx-trigger>
            </template>
          </fx-repeat>

          <fx-button label="append">
            <fx-append repeat="todos" ref="task"></fx-append>
          </fx-button>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    // hits the first button which is the delete button here
    const buttons = el.querySelectorAll('fx-trigger');
    await buttons[2].performActions();

    const repeat = el.querySelector('fx-repeat');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll('fx-repeatitem');
    expect(rItems.length).to.equal(3);
    expect(rItems[2].hasAttribute('repeat-index')).to.be.true;
    expect(repeat.getAttribute('index')).to.equal('3');
  });

  it('does not delete readonly item', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>

          <fx-bind ref="task" readonly="count(../task) lt 3">
            <fx-bind ref="./text()" required="true()"></fx-bind>
            <fx-bind ref="@complete" type="xs:boolean"></fx-bind>
            <fx-bind ref="@due" type="xs:date"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-group>
          <h1>todos</h1>

          <fx-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
            <template>
              <fx-control ref="." id="task" type="text">
                <label>Task</label>
              </fx-control>
              <fx-trigger>
                <label>delete</label>
                <fx-delete ref="."></fx-delete>
              </fx-trigger>
            </template>
          </fx-repeat>

          <fx-trigger>
            <label>append</label>
            <fx-append repeat="todos" ref="task"></fx-append>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    expect(el.getModel().modelItems.length).to.equal(6);

    // hits the first button which is the delete button here
    const button = el.querySelector('fx-trigger');
    await button.performActions();

    const repeat = el.querySelector('fx-repeat');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll('fx-repeatitem');
    expect(rItems.length).to.equal(2);
    expect(rItems[0].hasAttribute('repeat-index')).to.be.true;
    expect(el.getModel().modelItems.length).to.equal(6);
  });

  it('deletes a set of nodes', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <h1>todos</h1>

          <fx-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
            <template>
              <fx-control ref="." id="task" type="text">
                <label>Task</label>
              </fx-control>
            </template>
          </fx-repeat>

          <fx-trigger>
            <label>delete</label>
            <fx-delete ref="task"></fx-delete>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);

    // hits the first button which is the delete button here
    const button = el.querySelector('fx-trigger');
    await button.performActions();

    const repeat = el.querySelector('fx-repeat');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll('fx-repeatitem');
    expect(rItems.length).to.equal(0);
    // expect(rItems[0].hasAttribute('repeat-index')).to.be.true;
    expect(el.getModel().modelItems.length).to.equal(0);
  });

  it('deletes first task', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <h1>todos</h1>

          <fx-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
            <template>
              <fx-control ref="." id="task" type="text">
                <label>Task</label>
              </fx-control>
            </template>
          </fx-repeat>

          <fx-trigger>
            <label>delete</label>
            <fx-delete ref="task[1]"></fx-delete>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);

    // hits the first button which is the delete button here
    const button = el.querySelector('fx-trigger');
    await button.performActions();

    const repeat = el.querySelector('fx-repeat');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll('fx-repeatitem');
    expect(rItems.length).to.equal(1);
    // expect(rItems[0].hasAttribute('repeat-index')).to.be.true;
    expect(el.getModel().modelItems.length).to.equal(1);
    expect(el.getModel().modelItems[0].value).to.equal('Make tutorial part 1');
  });

  it('deletes second task', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <h1>todos</h1>

          <fx-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
            <template>
              <fx-control ref="." id="task" type="text">
                <label>Task</label>
              </fx-control>
            </template>
          </fx-repeat>

          <fx-trigger>
            <label>delete</label>
            <fx-delete ref="task[2]"></fx-delete>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);

    // hits the first button which is the delete button here
    const button = el.querySelector('fx-trigger');
    await button.performActions();

    const repeat = el.querySelector('fx-repeat');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll('fx-repeatitem');
    expect(rItems.length).to.equal(1);
    // expect(rItems[0].hasAttribute('repeat-index')).to.be.true;
    expect(el.getModel().modelItems.length).to.equal(1);
    expect(el.getModel().modelItems[0].value).to.equal('Pick up Milk');
  });

  it('deletes last item', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <h1>todos</h1>

          <fx-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
            <template>
              <fx-control ref="." id="task" type="text">
                <label>Task</label>
              </fx-control>
            </template>
          </fx-repeat>

          <fx-trigger>
            <label>delete</label>
            <fx-delete ref="task[last()]"></fx-delete>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);

    // hits the first button which is the delete button here
    const button = el.querySelector('fx-trigger');
    await button.performActions();

    const repeat = el.querySelector('fx-repeat');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll('fx-repeatitem');
    expect(rItems.length).to.equal(1);
    // expect(rItems[0].hasAttribute('repeat-index')).to.be.true;
    expect(el.getModel().modelItems.length).to.equal(1);
    expect(el.getModel().modelItems[0].value).to.equal('Pick up Milk');
  });

  it('does not delete instance itself', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <h1>todos</h1>

          <fx-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
            <template>
              <fx-control ref="." id="task" type="text">
                <label>Task</label>
              </fx-control>
            </template>
          </fx-repeat>

          <fx-trigger>
            <label>delete</label>
            <fx-delete ref="instance()"></fx-delete>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);

    // hits the first button which is the delete button here
    const button = el.querySelector('fx-trigger');
    await button.performActions();

    const repeat = el.querySelector('fx-repeat');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll('fx-repeatitem');
    expect(rItems.length).to.equal(2);
    // expect(rItems[0].hasAttribute('repeat-index')).to.be.true;
    expect(el.getModel().modelItems.length).to.equal(2);
  });

  it('does not delete instance root', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <h1>todos</h1>

          <fx-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
            <template>
              <fx-control ref="." id="task" type="text">
                <label>Task</label>
              </fx-control>
            </template>
          </fx-repeat>

          <fx-trigger>
            <label>delete</label>
            <fx-delete ref="instance()/data"></fx-delete>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);

    // hits the first button which is the delete button here
    const button = el.querySelector('fx-trigger');
    await button.performActions();

    const repeat = el.querySelector('fx-repeat');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll('fx-repeatitem');
    expect(rItems.length).to.equal(2);

    const instance = el.querySelector('fx-instance');
    console.log('isntance', instance);
    const firstChild = instance.instanceData.firstElementChild;
    expect(firstChild.nodeName).to.equal('data');
  });

  it('deletes from non-default instance', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>
          <fx-instance id="items">
            <data>
              <item>item1</item>
              <item>item2</item>
              <item>item3</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>

          <fx-trigger>
            <label>delete</label>
            <fx-delete ref="instance('items')/item"></fx-delete>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);

    // hits the first button which is the delete button here
    const button = el.querySelector('fx-trigger');
    await button.performActions();

    const instance = el.querySelector('fx-instance[id="items"]');
    const items = evaluateXPathToNodes('item', instance.instanceData);
    expect(items.length).to.equal(0);
  });

  it('deletes one from non-default instance', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-delete event="model-construct-done" ref="//item[2]"></fx-delete>
          <fx-instance>
            <data>
              <item>item1</item>
              <item>item2</item>
              <item>item3</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat ref="item">
          <template>
            <fx-control ref="." id="task" type="text">
              <label>Task</label>
            </fx-control>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const repeat = el.querySelector('fx-repeat');
    expect(repeat.nodeset.length).to.equal(2);
    expect(repeat.nodeset[0].textContent).to.equal('item1');
    expect(repeat.nodeset[1].textContent).to.equal('item3');
  });
  it('deletes one from non-default instance', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-delete event="model-construct-done" ref="instance('items')//item[2]"></fx-delete>
          <fx-instance>
            <data></data>
          </fx-instance>
          <fx-instance id="items">
            <data>
              <item>item1</item>
              <item>item2</item>
              <item>item3</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat ref="instance('items')/item">
          <template>
            <fx-control ref="." id="task" type="text">
              <label>Task</label>
            </fx-control>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await elementUpdated(el);

    const repeat = el.querySelector('fx-repeat');
    expect(repeat.nodeset.length).to.equal(2);
    expect(repeat.nodeset[0].textContent).to.equal('item1');
    expect(repeat.nodeset[1].textContent).to.equal('item3');
  });
});
