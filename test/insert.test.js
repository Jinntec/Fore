/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixtureSync, expect } from '@open-wc/testing';
import * as fx from 'fontoxpath';

import '../src/fx-instance.js';

describe('insert Tests', () => {
  it('inserts at end by default', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data> </data>
          </fx-instance>
          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="task"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(0);
  });

  it('inserts at end by default', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
              <task complete="true" due="2020-01-05">Make tutorial part 2</task>
            </data>
          </fx-instance>
          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="task" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(4);
    expect(tasks[2].textContent).to.equal('Make tutorial part 2');
    expect(tasks[2].getAttribute('complete')).to.equal('true');
    expect(tasks[2].getAttribute('due')).to.equal('2020-01-05');

    expect(tasks[3].textContent).to.equal('Make tutorial part 2');
    expect(tasks[3].getAttribute('complete')).to.equal('true');
    expect(tasks[3].getAttribute('due')).to.equal('2020-01-05');

    expect(el.getModel().modelItems.length).to.equal(4);

    expect(tasks[2].textContent).to.equal(tasks[3].textContent);
    expect(tasks[2].getAttribute('complete')).to.equal(tasks[3].getAttribute('complete'));
    expect(tasks[2].getAttribute('due')).to.equal(tasks[3].getAttribute('due'));
  });

  it('inserts as first with position=before', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
              <task complete="true" due="2020-01-05">Make tutorial part 2</task>
            </data>
          </fx-instance>
          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert as first</button>
          <fx-insert ref="task" position="before" at="1" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(4);
    expect(tasks[0].textContent).to.equal('Make tutorial part 2');
    expect(tasks[0].getAttribute('complete')).to.equal('true');
    expect(tasks[0].getAttribute('due')).to.equal('2020-01-05');

    expect(el.getModel().modelItems.length).to.equal(4);

    expect(tasks[0].textContent).to.equal(tasks[3].textContent);
    expect(tasks[0].getAttribute('complete')).to.equal(tasks[3].getAttribute('complete'));
    expect(tasks[0].getAttribute('due')).to.equal(tasks[3].getAttribute('due'));
  });

  it('inserts after first with position=after', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
              <task complete="true" due="2020-01-05">Make tutorial part 2</task>
            </data>
          </fx-instance>
          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert after first</button>
          <fx-insert ref="task" position="after" at="1" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(4);
    expect(tasks[1].textContent).to.equal('Make tutorial part 2');
    expect(tasks[1].getAttribute('complete')).to.equal('true');
    expect(tasks[1].getAttribute('due')).to.equal('2020-01-05');

    expect(el.getModel().modelItems.length).to.equal(4);

    expect(tasks[1].textContent).to.equal(tasks[3].textContent);
    expect(tasks[1].getAttribute('complete')).to.equal(tasks[3].getAttribute('complete'));
    expect(tasks[1].getAttribute('due')).to.equal(tasks[3].getAttribute('due'));
  });

  it('inserts from origin', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task></task>
            </data>
          </fx-instance>
          <fx-instance id="templ">
            <data>
              <task> </task>
              <foo> </foo>
            </data>
          </fx-instance>
          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="instance('default')/data" origin="instance('templ')/foo"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPathToNodes('//foo', inst, null, {});

    expect(tasks.length).to.equal(1);
  });

  it('inserts when targetSequence is a single item', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task></task>
            </data>
          </fx-instance>
          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" id="r-todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="task"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(2);
  });

  it('inserts after current repeatitem', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task>one</task>
              <task>two</task>
              <task>three</task>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="task" at="index('todos')" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(4);
    expect(tasks[1].textContent).to.equal('three');
  });

  it('inserts before current repeatitem', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task>one</task>
              <task>two</task>
              <task>three</task>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="task" at="index('todos')" position="before" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(4);

    expect(tasks[0].textContent).to.equal('three');
  });

  it('inserts with context wether list is empty or not', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <list><a>1</a><a>2</a><a>3</a></list>
              <blank><a>0</a></blank>
            </data>
          </fx-instance>
        </fx-model>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert context="list" ref="a" origin="../blank/a"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const items = fx.evaluateXPath('//list/a', inst, null, {});

    expect(items.length).to.equal(4);
    expect(items[3].textContent).to.equal('0');
  });

  it('inserts into inhomogenious nodeset at right position', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
              <data>
                  <a>a1</a>
                  <a>a2</a>
                  <a>a3</a>
                  <b>b1</b>
              </data>
          </fx-instance>
        </fx-model>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="a"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);

    let item = fx.evaluateXPath('//a[1]', inst, null, {});
    expect(item.textContent).to.equal('a1');
    item = fx.evaluateXPath('//a[2]', inst, null, {});
    expect(item.textContent).to.equal('a2');

    item = fx.evaluateXPath('//a[3]', inst, null, {});
    expect(item.textContent).to.equal('a3');
    item = fx.evaluateXPath('//a[4]', inst, null, {});
    expect(item.textContent).to.equal('');
    item = fx.evaluateXPath('//*[4]', inst, null, {});
    expect(item.textContent).to.equal('');

    item = fx.evaluateXPath('//*[5]', inst, null, {});
    expect(item.textContent).to.equal('b1');
    item = fx.evaluateXPath('//b[1]', inst, null, {});
    expect(item.textContent).to.equal('b1');

  });
});
