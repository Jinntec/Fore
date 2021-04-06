/* eslint-disable no-unused-expressions */
import {
  html,
  oneEvent,
  fixture,
  fixtureSync,
  expect,
  elementUpdated,
  defineCE,
} from '@open-wc/testing';

/*
import '../src/fx-instance.js';
import '../src/modelitem.js';
import '../src/fx-model.js';
import '../src/fx-bind.js';
import '../src/fx-button.js';
import '../src/fx-repeat.js';
import '../src/fx-repeatitem.js';
*/
import '../src/ui/fx-repeat.js';
import { FxModel } from '../src/fx-model.js';

describe('repeat Tests', () => {
  it('has initialized modelItems', async () => {
    const el = await fixtureSync(html`
      <fx-form>
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
      </fx-form>
    `);

    const { detail } = await oneEvent(el, 'refresh-done');

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
      <fx-form>
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
      </fx-form>
    `);

    const { detail } = await oneEvent(el, 'refresh-done');

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
      <fx-form>
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
      </fx-form>
    `);

    const { detail } = await oneEvent(el, 'refresh-done');

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
      <fx-form>
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
      </fx-form>
    `);

    // await elementUpdated(el);
    const { detail } = await oneEvent(el, 'refresh-done');

    const inputs = el.querySelectorAll('fx-repeatitem fx-input');
    await elementUpdated(inputs);

    expect(inputs.length).to.equal(2);
    console.log('inputs ', inputs);
    expect(inputs[0].getAttribute('value')).to.equal('Pick up Milk');
    expect(inputs[0].value).to.equal('Pick up Milk');
    expect(inputs[1].getAttribute('value')).to.equal('Make tutorial part 1');
    expect(inputs[1].value).to.equal('Make tutorial part 1');
  });

  /*
    it('handles a modelItem for the repeat itself', async () => {
        const el =  (
            await fixtureSync(html`
                <fx-form>
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
                </fx-form>
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
      <fx-form>
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
      </fx-form>
    `);

    await elementUpdated(el);

    const button = el.querySelector('fx-button');
    await elementUpdated(button);

    button.performActions();

    const repeat = el.querySelector('fx-repeat');
    await elementUpdated(repeat);

    expect(repeat).to.exist;
    const rItems = repeat.querySelectorAll('fx-repeatitem');
    console.log('fx-repeat ', repeat);
    expect(rItems.length).to.equal(3);

    // appended item should have repeatindex set
    expect(rItems[2].hasAttribute('repeat-index')).to.be.true;
  });

  it('deletes an item', async () => {
    const el = await fixtureSync(html`
      <fx-form>
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
              <fx-button label="delete">
                <fx-delete ref="."></fx-delete>
              </fx-button>
            </template>
          </fx-repeat>

          <fx-button label="append">
            <fx-append repeat="todos" ref="task"></fx-append>
          </fx-button>
        </fx-group>
      </fx-form>
    `);

    const { detail } = await oneEvent(el, 'refresh-done');

    // hits the first button which is the delete button here
    const button = el.querySelector('fx-button');
    button.performActions();

    const repeat = el.querySelector('fx-repeat');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll('fx-repeatitem');
    expect(rItems.length).to.equal(1);
    expect(rItems[0].hasAttribute('repeat-index')).to.be.true;
  });

  it('deletes an item and sets index', async () => {
    const el = await fixtureSync(html`
      <fx-form>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
              <task complete="false" due="2019-01-05">third task</task>
              <task complete="false" due="2019-01-06">fourth task</task>
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
              <fx-button label="delete">
                <fx-delete ref="."></fx-delete>
              </fx-button>
            </template>
          </fx-repeat>

          <fx-button label="append">
            <fx-append repeat="todos" ref="task"></fx-append>
          </fx-button>
        </fx-group>
      </fx-form>
    `);

    const { detail } = await oneEvent(el, 'refresh-done');

    // hits the first button which is the delete button here
    const buttons = el.querySelectorAll('fx-button');
    buttons[2].performActions();

    const repeat = el.querySelector('fx-repeat');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll('fx-repeatitem');
    expect(rItems.length).to.equal(3);
    expect(rItems[2].hasAttribute('repeat-index')).to.be.true;
  });

  it('handles indexes in simple repeat', async () => {
    const el = await fixtureSync(html`
      <fx-form>
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
            <fx-input id="task" label="Task" ref="." type="text"></fx-input>
            <fx-input label="Due" ref="@due" type="date"></fx-input>
            <fx-input Label="Status" ref="@complete" type="checkbox"></fx-input>
            <fx-button label="delete">
              <fx-delete ref="."></fx-delete>
            </fx-button>
          </template>
        </fx-repeat>

        <fx-button id="append" label="append">
          <fx-append ref="task" repeat="r-todos" clear="true"></fx-append>
        </fx-button>
      </fx-form>
    `);

    const { detail } = await oneEvent(el, 'refresh-done');

    // hits the first button which is the delete button here
    const append = el.querySelector('#append');
    append.performActions();

    const repeat = el.querySelector('#r-todos');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll(':scope > fx-repeatitem');
    expect(rItems.length).to.equal(3);
    console.log('ritems ', rItems);
    expect(rItems[2].hasAttribute('repeat-index')).to.be.true;
  });

  it('handles indexes in nested repeat', async () => {
    const el = await fixtureSync(html`
      <fx-form>
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

            <fx-button label="add subtask">
              <fx-append ref="task" repeat="r-subtask" clear="true"></fx-append>
            </fx-button>
            <fx-button label="delete">
              <fx-delete ref="."></fx-delete>
            </fx-button>
          </template>
        </fx-repeat>

        <fx-button id="outerappend" label="add maintask">
          <fx-append ref="task" repeat="r-todos" clear="true"></fx-append>
        </fx-button>
      </fx-form>
    `);

    const { detail } = await oneEvent(el, 'refresh-done');

    // hits the first button which is the delete button here
    const append = el.querySelector('#outerappend');
    append.performActions();

    const repeat = el.querySelector('#r-todos');
    expect(repeat).to.exist;

    const rItems = repeat.querySelectorAll(':scope > fx-repeatitem');
    expect(rItems.length).to.equal(2);
    console.log('ritems ', rItems);
    expect(rItems[1].hasAttribute('repeat-index')).to.be.true;
  });
});
