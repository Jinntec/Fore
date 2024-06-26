/* eslint-disable no-unused-expressions */
import {
  html, oneEvent, fixtureSync, expect, elementUpdated,
} from '@open-wc/testing';

import '../index.js';
import { FxModel } from '../src/fx-model.js';

describe('repeat Tests', () => {
  it('has initialized modelItems', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>

          <fx-bind ref="task">
            <fx-bind ref="." required="true()"></fx-bind>
            <fx-bind ref="@complete" type="xs:boolean"></fx-bind>
            <fx-bind ref="@due" type="xs:date"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-group>
          <h1>todos</h1>

          <fx-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
            <template>
              <fx-input label="Task" ref="." id="task" type="text"></fx-input>
            </template>
          </fx-repeat>

          <fx-button label="append">
            <fx-append repeat="todos" ref="task"></fx-append>
          </fx-button>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const model = document.getElementById('record');
    expect(model.modelItems.length).to.equal(6);

    // some modelItem checks
    expect(model.modelItems[0].node.nodeName).to.equal('task');
    expect(model.modelItems[0].value).to.equal('Pick up Milk');
    expect(model.modelItems[0].required).to.equal(true);

    expect(model.modelItems[1].node.nodeName).to.equal('task');
    expect(model.modelItems[1].value).to.equal('Make tutorial part 1');
    expect(model.modelItems[1].required).to.equal(true);

    expect(model.modelItems[2].node.nodeName).to.equal('complete'); // text node
    expect(model.modelItems[2].node.nodeType).to.equal(2); // attribute node
    expect(model.modelItems[2].value).to.equal('false');

    expect(model.modelItems[3].node.nodeName).to.equal('complete'); // text node
    expect(model.modelItems[3].node.nodeType).to.equal(2); // attribute node
    expect(model.modelItems[3].value).to.equal('true');

    expect(model.modelItems[4].node.nodeName).to.equal('due'); // text node
    expect(model.modelItems[4].node.nodeType).to.equal(2); // attribute node
    expect(model.modelItems[4].value).to.equal('2019-02-04');

    expect(model.modelItems[5].node.nodeName).to.equal('due'); // text node
    expect(model.modelItems[5].node.nodeType).to.equal(2); // attribute node
    expect(model.modelItems[5].value).to.equal('2019-01-04');
  });

  it('has initialized repeat with 2 repeat items', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>

          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
            <fx-bind ref="@complete" type="xs:boolean"></fx-bind>
            <fx-bind ref="@due" type="xs:date"></fx-bind>
          </fx-bind>
        </fx-model>

        <h1>todos</h1>

        <fx-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
          <template>
            <fx-input label="Task" ref="." id="task" type="text"></fx-input>
          </template>
        </fx-repeat>

        <fx-button label="append">
          <fx-append repeat="todos" ref="task"></fx-append>
        </fx-button>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = document.getElementById('todos');

    const repeatNodes = repeat.nodeset;
    console.log('items', repeatNodes);

    expect(repeatNodes.length).to.equal(2);

    const items = repeat.querySelectorAll('fx-repeatitem');
    // const items = document.querySelectorAll('fx-repeatitem');
    // console.log('items', items);
    expect(items.length).to.equal(2);

    expect(repeat.getModel() instanceof FxModel).to.be.true;

    let m = repeat.getModel().getModelItem(repeatNodes[0]);
    console.log('repeatnode 1 ', m);
    console.log('repeatnode 1 ', m.value);

    expect(m.value).to.equal('Pick up Milk');

    // check if control has correct value
    const inputs = el.querySelectorAll('fx-input');

    expect(inputs.length).to.equal(2);

    m = repeat.getModel().getModelItem(repeatNodes[1]);
    console.log('repeatnode 1 ', m);
    console.log('repeatnode 1 ', m.value);

    expect(m.value).to.equal('Make tutorial part 1');
  });

  it('has initialized repeat with 2 repeat items within a outer group', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>

          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
            <fx-bind ref="@complete" type="xs:boolean"></fx-bind>
            <fx-bind ref="@due" type="xs:date"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-group>
          <h1>todos</h1>

          <fx-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
            <template>
              <fx-input label="Task" ref="." id="task" type="text"></fx-input>
            </template>
          </fx-repeat>

          <fx-button label="append">
            <fx-append repeat="todos" ref="task"></fx-append>
          </fx-button>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = document.getElementById('todos');

    const repeatNodes = repeat.nodeset;
    console.log('items', repeatNodes);

    expect(repeatNodes.length).to.equal(2);

    const items = document.querySelectorAll('fx-repeatitem');
    console.log('items', items);
    expect(items.length).to.equal(2);

    let m = repeat.getModel().getModelItem(repeatNodes[0]);
    console.log('repeatnode 1 ', m);
    console.log('repeatnode 1 ', m.value);

    expect(m.value).to.equal('Pick up Milk');

    m = repeat.getModel().getModelItem(repeatNodes[1]);
    console.log('repeatnode 1 ', m);
    console.log('repeatnode 1 ', m.value);

    expect(m.value).to.equal('Make tutorial part 1');
  });

  it('has initialized repeat with 2 repeat items and proper UI state', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>

          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
            <fx-bind ref="@complete" type="xs:boolean"></fx-bind>
            <fx-bind ref="@due" type="xs:date"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-group>
          <h1>todos</h1>

          <fx-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
            <template>
              <fx-control label="Task" ref="." id="task" type="text"></fx-control>
            </template>
          </fx-repeat>

          <fx-button label="append">
            <fx-append repeat="todos" ref="task"></fx-append>
          </fx-button>
        </fx-group>
      </fx-fore>
    `);

    // await elementUpdated(el);
    await oneEvent(el, 'refresh-done');

    const inputs = el.querySelectorAll('fx-repeatitem fx-control');
    await elementUpdated(inputs);

    expect(inputs.length).to.equal(2);
    console.log('inputs ', inputs);
    // expect(inputs[0].getAttribute('value')).to.equal('Pick up Milk');
    expect(inputs[0].value).to.equal('Pick up Milk');
    // expect(inputs[1].getAttribute('value')).to.equal('Make tutorial part 1');
    expect(inputs[1].value).to.equal('Make tutorial part 1');
  });

  /*
    it('handles a modelItem for the repeat itself', async () => {
        const el =  (
            await fixtureSync(html`
                <fx-fore>
                    <fx-model id="record">

                        <fx-instance>
                            <data>
                                <task complete="false" due="2019-02-04">Pick up Milk</task>
                                <task complete="true" due="2019-01-04">Make tutorial part 1</task>
                            </data>
                        </fx-instance>

                        <fx-bind ref="task" readonly="count(../task) < 3">
                            <fx-bind ref="./text()" required="true()"></fx-bind>
                            <fx-bind ref="@complete" type="xs:boolean"></fx-bind>
                            <fx-bind ref="@due" type="xs:date"></fx-bind>
                        </fx-bind>

                    </fx-model>
                    <fx-group>
                        <h1>todos</h1>

                        <fx-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
                            <template>
                                <fx-input label="Task" ref="." id="task" type="text"></fx-input>
                            </template>
                        </fx-repeat>

                        <fx-button label="append">
                            <fx-append repeat="todos" ref="task"></fx-append>
                        </fx-button>
                    </fx-group>
                </fx-fore>
            `)
        );

        await elementUpdated(el);

        const repeat = el.querySelector('fx-repeat');
        await elementUpdated(repeat);

        // expect(repeat.getModelItem()).to.equal(null);

    });
*/

  it('appends an item', async () => {
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

          <fx-repeat id="todos" ref="task" id="r-todos">
            <template>
              <fx-control ref="." id="task" type="text">
                <label>Task</label>
              </fx-control>
            </template>
          </fx-repeat>

          <fx-trigger label="append">
            <button>append</button>
            <fx-append repeat="todos" ref="task"></fx-append>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    // await elementUpdated(el);
    await oneEvent(el, 'refresh-done');

    const button = el.querySelector('fx-trigger');
    await button.performActions();
    const repeat = el.querySelector('fx-repeat');

    expect(repeat).to.exist;
    const rItems = repeat.querySelectorAll('fx-repeatitem');
    expect(rItems.length).to.equal(3);
  });

  it('set the index to new item after append', async () => {
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

          <fx-repeat id="todos" ref="task" id="r-todos">
            <template>
              <fx-control ref="." id="task" type="text">
                <label>Task</label>
              </fx-control>
            </template>
          </fx-repeat>

          <fx-trigger label="append">
            <button>append</button>
            <fx-append repeat="todos" ref="task"></fx-append>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    // await elementUpdated(el);
    await oneEvent(el, 'refresh-done');

    const button = el.querySelector('fx-trigger');
    await button.performActions();
    const repeat = el.querySelector('fx-repeat');
    expect(repeat.index).to.equal(3);
    // appended item should have repeatindex set
    const rItems = repeat.querySelectorAll('fx-repeatitem');
    expect(rItems[2].hasAttribute('repeat-index')).to.be.true;
  });

  it('sets index to 1 by default in simple repeat', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>

          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
            <fx-bind ref="@complete" type="xs:boolean"></fx-bind>
            <fx-bind ref="@due" type="xs:date"></fx-bind>
          </fx-bind>
        </fx-model>

        <h1>todos</h1>

        <fx-repeat focus-on-create="task" id="r-todos" ref="task">
          <template>
            <fx-control id="task" label="Task" ref="." type="text"></fx-control>
            <fx-control label="Due" ref="@due" type="date"></fx-control>
            <fx-control Label="Status" ref="@complete" type="checkbox"></fx-control>
            <fx-trigger label="delete">
              <fx-delete ref="."></fx-delete>
            </fx-trigger>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('#r-todos');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll(':scope > fx-repeatitem');
    expect(rItems.length).to.equal(2);
    expect(rItems[0].hasAttribute('repeat-index')).to.be.true;
  });

  it('handles indexes in simple repeat', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>

          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
            <fx-bind ref="@complete" type="xs:boolean"></fx-bind>
            <fx-bind ref="@due" type="xs:date"></fx-bind>
          </fx-bind>
        </fx-model>

        <h1>todos</h1>

        <fx-repeat focus-on-create="task" id="r-todos" ref="task">
          <template>
            <fx-control id="task" label="Task" ref="." type="text"></fx-control>
            <fx-control label="Due" ref="@due" type="date"></fx-control>
            <fx-control Label="Status" ref="@complete" type="checkbox"></fx-control>
            <fx-trigger label="delete">
              <fx-delete ref="."></fx-delete>
            </fx-trigger>
          </template>
        </fx-repeat>

        <fx-trigger id="append" label="append">
          <fx-append ref="task" repeat="r-todos" clear="true"></fx-append>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    // hits the first button which is the delete button here
    const append = el.querySelector('#append');
    await append.performActions();

    const repeat = el.querySelector('#r-todos');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll(':scope > fx-repeatitem');
    expect(rItems.length).to.equal(3);
    console.log('ritems ', rItems);
    expect(rItems[2].hasAttribute('repeat-index')).to.be.true;
  });

  it('handles indexes in nested repeat', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <task text="Pick up Milk">
                <task text="go to store"></task>
              </task>
            </data>
          </fx-instance>

          <fx-bind ref="task">
            <fx-bind ref="@text"></fx-bind>

            <fx-bind ref="task">
              <fx-bind ref="@text"></fx-bind>
            </fx-bind>
          </fx-bind>
        </fx-model>
        <h1>todos</h1>
        <fx-repeat focus-on-create="task" id="r-todos" ref="task">
          <template>
            <fx-control label="task" ref="@text"></fx-control>
            <fx-repeat id="r-subtask" ref="task">
              <template>
                <fx-control id="task" label="Task" ref="@text" type="text"></fx-control>
                <fx-button label="delete">
                  <fx-delete ref="."></fx-delete>
                </fx-button>
              </template>
            </fx-repeat>

            <fx-trigger label="add subtask">
              <fx-append ref="task" repeat="r-subtask" clear="true"></fx-append>
            </fx-trigger>
            <fx-trigger label="delete">
              <fx-delete ref="."></fx-delete>
            </fx-trigger>
          </template>
        </fx-repeat>

        <fx-trigger id="outerappend" label="add maintask">
          <fx-append ref="task" repeat="r-todos" clear="true"></fx-append>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    // hits the first button which is the delete button here
    const append = el.querySelector('#outerappend');
    await append.performActions();

    const repeat = el.querySelector('#r-todos');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll(':scope > fx-repeatitem');
    expect(rItems.length).to.equal(2);
    console.log('ritems ', rItems);
    expect(rItems[1].hasAttribute('repeat-index')).to.be.true;
  });

  it('handles atomic value', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data> </data>
          </fx-instance>
        </fx-model>
        <fx-repeat ref="1 to 10">
          <template>
            {.}
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const rItems = el.querySelectorAll('fx-repeatitem');
    expect(rItems.length).to.equal(10);
  });

  it('handles simple table via attributes and handles change of index', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <item>
                <field name="a">a</field>
                <field name="b">b</field>
                <field name="c">c</field>
                <field name="d">d</field>
                <field name="e">e</field>
                <field name="f">f</field>
              </item>
              <item>
                <field name="a">g</field>
                <field name="b">h</field>
                <field name="c">i</field>
                <field name="d">j</field>
                <field name="e">k</field>
                <field name="f">l</field>
              </item>
              <item>
                <field name="a">m</field>
                <field name="b">n</field>
                <field name="c">o</field>
                <field name="d">p</field>
                <field name="e">q</field>
                <field name="f">r</field>
              </item>
            </data>
          </fx-instance>
        </fx-model>
        <table data-ref="item">
          <template>
            <tr>
              <td><fx-output ref="field[@name='a']"></fx-output></td>
              <td><fx-output ref="field[@name='b']"></fx-output></td>
              <td><fx-output ref="field[@name='c']"></fx-output></td>
              <td><fx-output ref="field[@name='d']"></fx-output></td>
              <td><fx-output ref="field[@name='e']"></fx-output></td>
              <td><fx-output ref="field[@name='f']"></fx-output></td>
            </tr>
          </template>
        </table>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('fx-repeat-attributes');
    expect(repeat).to.exist;
    expect(repeat.index).to.equal(1);

    const rItems = el.querySelectorAll('.fx-repeatitem');
    expect(rItems.length).to.equal(3);
    expect(rItems[0].hasAttribute('repeat-index')).to.be.true;

    rItems[1].click();
    // await oneEvent(repeat, 'item-changed');
    expect(rItems[0].hasAttribute('repeat-index')).to.be.false;
    expect(rItems[1].hasAttribute('repeat-index')).to.be.true;
    expect(repeat.index).to.equal(2);
  });
});
