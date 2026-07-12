1; /* eslint-disable no-unused-expressions */
import { html, oneEvent, fixtureSync, expect, elementUpdated, fixture } from '@open-wc/testing';

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
    expect(items.length).to.equal(2, 'There should be two repeat items');

    expect(repeat.getModel() instanceof FxModel).to.be.true;

    let m = repeat.getModel().getModelItem(repeatNodes[0]);
    console.log('repeatnode 1 ', m);
    console.log('repeatnode 1 ', m.value);

    expect(m.value).to.equal('Pick up Milk');

    // check if control has correct value
    const inputs = el.querySelectorAll('fx-input');

    expect(inputs.length).to.equal(2, 'There should be two inputs, one for each item');

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

  it('keeps getModelItem resolvable per row through many inserts and deletes', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
            </data>
          </fx-instance>

          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
            <fx-bind ref="@complete" type="xs:boolean"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-group>
          <fx-repeat id="todos" ref="task" id="r-todos">
            <template>
              <fx-control ref="." id="task" type="text">
                <label>Task</label>
              </fx-control>
              <fx-control ref="@complete" type="text">
                <label>Complete</label>
              </fx-control>
            </template>
          </fx-repeat>

          <fx-trigger label="append">
            <button>append</button>
            <fx-append repeat="todos" ref="task"></fx-append>
          </fx-trigger>
          <fx-trigger label="delete-first">
            <button>delete-first</button>
            <fx-delete ref="task[1]"></fx-delete>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    const [appendTrigger, deleteTrigger] = el.querySelectorAll('fx-trigger');

    // covers the "dewey rewrite" path-mutation on insert (fx-repeat.js/repeat-base.js
    // _createModelItemsRecursively), which must keep _modelItemsByPath in sync.
    const ROW_COUNT = 60;
    for (let i = 0; i < ROW_COUNT; i += 1) {
      await appendTrigger.performActions();
    }

    expect(model.modelItems.length).to.be.greaterThan(ROW_COUNT);
    expect(model._modelItemsByPath.size).to.equal(model.modelItems.length);
    model.modelItems.forEach(mi => {
      expect(model.getModelItem(mi.path)).to.equal(mi);
      expect(model.getModelItem(mi.node)).to.equal(mi);
    });

    const DELETE_COUNT = 15;
    for (let i = 0; i < DELETE_COUNT; i += 1) {
      await deleteTrigger.performActions();
    }

    expect(model._modelItemsByPath.size).to.equal(model.modelItems.length);
    model.modelItems.forEach(mi => {
      expect(model.getModelItem(mi.path)).to.equal(mi);
      expect(model.getModelItem(mi.node)).to.equal(mi);
    });
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

  it('can insert and remove an item using fx-delete', async () => {
    const el = await fixture(
      html`<fx-fore>
        <fx-model>
          <fx-instance>
            <data> </data>
          </fx-instance>
        </fx-model>
        <fx-repeat ref="1 to 10">
          <template> {.} </template>
        </fx-repeat>
      </fx-fore>`,
    );
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
          <template> {.} </template>
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

  it('exposes list/listitem roles and a focusable tabindex on repeat items', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <task>Pick up Milk</task>
              <task>Make tutorial part 1</task>
            </data>
          </fx-instance>
        </fx-model>

        <fx-repeat id="r-todos" ref="task">
          <template>
            <fx-output ref="."></fx-output>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('#r-todos');
    // role="list" lives on a shadow-DOM wrapper around the default slot, not on the host,
    // so a `slot="header"` sibling (e.g. a <table> column header) isn't dragged into the
    // list's accessibility subtree - see fx-repeat.js connectedCallback.
    const listWrapper = repeat.shadowRoot.querySelector('[role="list"]');
    expect(listWrapper).to.exist;

    const rItems = repeat.querySelectorAll(':scope > fx-repeatitem');
    expect(rItems.length).to.equal(2);
    rItems.forEach(item => {
      expect(item.getAttribute('role')).to.equal('listitem');
      // `tabindex` (lowercase) is not a reflected IDL property; regression guard for the
      // former `this.tabindex = 0` no-op that never set the real `tabindex` attribute.
      expect(item.getAttribute('tabindex')).to.equal('0');
      expect(item.tabIndex).to.equal(0);
    });
  });
});

async function waitUntil(predicate, { timeout = 2000, interval = 50 } = {}) {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) {
      throw new Error('waitUntil: timed out waiting for condition');
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

describe('repeat progressive rendering (size)', () => {
  it('caps initial materialization to size, keeping the full nodeset logically', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data></data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="r-cap" ref="1 to 10" size="3">
          <template>{.}</template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('#r-cap');
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(3);
    expect(repeat.nodeset.length).to.equal(10);
  });

  it('does not create a sentinel when size is at least the nodeset length', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data></data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="r-cap" ref="1 to 10" size="20">
          <template>{.}</template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('#r-cap');
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(10);
    expect(repeat.querySelectorAll('.fx-repeat-sentinel').length).to.equal(0);
  });

  it('does not cap or create a sentinel when size is absent', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data></data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="r-uncapped" ref="1 to 10">
          <template>{.}</template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('#r-uncapped');
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(10);
    expect(repeat.querySelectorAll('.fx-repeat-sentinel').length).to.equal(0);
  });

  it('reveals the next chunk when the sentinel intersects', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data></data>
          </fx-instance>
        </fx-model>
        <div id="scroller" style="height:100px;overflow:auto;">
          <fx-repeat id="r-scroll" ref="1 to 10" size="3">
            <template>
              <div style="height:40px;">{.}</div>
            </template>
          </fx-repeat>
        </div>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('#r-scroll');
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(3);

    const scroller = el.querySelector('#scroller');

    scroller.scrollTop = scroller.scrollHeight;
    await waitUntil(() => repeat.querySelectorAll(':scope > fx-repeatitem').length === 6);

    scroller.scrollTop = scroller.scrollHeight;
    await waitUntil(() => repeat.querySelectorAll(':scope > fx-repeatitem').length === 9);

    scroller.scrollTop = scroller.scrollHeight;
    await waitUntil(() => repeat.querySelectorAll(':scope > fx-repeatitem').length === 10);

    expect(repeat.querySelectorAll('.fx-repeat-sentinel').length).to.equal(0);
  });

  it('setIndex grows the rendered window on demand', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data></data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="r-idx" ref="1 to 5" size="2">
          <template>{.}</template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('#r-idx');
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(2);

    repeat.setIndex(5);

    const rItems = repeat.querySelectorAll(':scope > fx-repeatitem');
    expect(rItems.length).to.equal(5);
    expect(rItems[4].hasAttribute('repeat-index')).to.equal(true);
  });

  it('XML insert within the rendered window materializes a row and shifts indices', async () => {
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
          <fx-bind ref="task"></fx-bind>
        </fx-model>
        <fx-repeat id="r-insert" ref="task" size="2">
          <template>
            <fx-output ref="."></fx-output>
          </template>
        </fx-repeat>
        <fx-trigger label="insert-first">
          <button>insert-first</button>
          <fx-insert ref="task" position="before" at="1"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('#r-insert');
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(2);

    const button = el.querySelector('fx-trigger');
    await button.performActions();

    const rItems = repeat.querySelectorAll(':scope > fx-repeatitem');
    // window grew by exactly the one inserted row, not to the full new total (4)
    expect(rItems.length).to.equal(3);
    expect(repeat.nodeset.length).to.equal(4);
    expect(rItems[1].index).to.equal(2);
  });

  it('XML insert beyond the rendered window does not eagerly materialize, but setIndex reveals it', async () => {
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
          <fx-bind ref="task"></fx-bind>
        </fx-model>
        <fx-repeat id="r-append" ref="task" size="2">
          <template>
            <fx-output ref="."></fx-output>
          </template>
        </fx-repeat>
        <fx-trigger label="append">
          <button>append</button>
          <fx-append repeat="r-append" ref="task"></fx-append>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('#r-append');
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(2);

    const button = el.querySelector('fx-trigger');
    await button.performActions();

    expect(repeat.nodeset.length).to.equal(4);
    const rItems = repeat.querySelectorAll(':scope > fx-repeatitem');
    expect(rItems.length).to.equal(4);
    expect(rItems[3].hasAttribute('repeat-index')).to.equal(true);
  });

  it('delete within the rendered window shrinks it and does not re-render the tail', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task>one</task>
              <task>two</task>
              <task>three</task>
              <task>four</task>
              <task>five</task>
            </data>
          </fx-instance>
          <fx-bind ref="task"></fx-bind>
        </fx-model>
        <fx-repeat id="r-del" ref="task" size="2">
          <template>
            <fx-output ref="."></fx-output>
            <fx-trigger label="delete">
              <button class="del">delete</button>
              <fx-delete ref="."></fx-delete>
            </fx-trigger>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('#r-del');
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(2);

    const firstDeleteTrigger = repeat.querySelector('fx-repeatitem fx-trigger');
    await firstDeleteTrigger.performActions();

    expect(repeat.nodeset.length).to.equal(4);
    // window shrinks by exactly the removed row - no auto-backfill from the hidden pool
    // in Phase 1 (recycling/backfill is deferred to a later phase per the roadmap doc)
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(1);
  });

  it('delete beyond the rendered window updates the nodeset without touching rendered rows', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task>one</task>
              <task>two</task>
              <task>three</task>
              <task>four</task>
              <task>five</task>
            </data>
          </fx-instance>
          <fx-bind ref="task"></fx-bind>
        </fx-model>
        <fx-repeat id="r-del2" ref="task" size="2">
          <template>
            <fx-output ref="."></fx-output>
          </template>
        </fx-repeat>
        <fx-trigger label="delete-last">
          <button>delete-last</button>
          <fx-delete ref="task[5]"></fx-delete>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('#r-del2');
    const before = Array.from(repeat.querySelectorAll(':scope > fx-repeatitem')).map(
      ri => ri.nodeset,
    );
    expect(before.length).to.equal(2);

    const button = el.querySelector('fx-trigger');
    await button.performActions();

    expect(repeat.nodeset.length).to.equal(4);
    const after = Array.from(repeat.querySelectorAll(':scope > fx-repeatitem'));
    expect(after.length).to.equal(2);
    after.forEach((ri, i) => expect(ri.nodeset).to.equal(before[i]));
  });

  it('nested repeat inside a capped outer repeat renders independently', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <row><val>1</val><val>2</val><val>3</val></row>
              <row><val>1</val><val>2</val><val>3</val></row>
              <row><val>1</val><val>2</val><val>3</val></row>
              <row><val>1</val><val>2</val><val>3</val></row>
              <row><val>1</val><val>2</val><val>3</val></row>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="r-outer" ref="row" size="2">
          <template>
            <fx-repeat ref="val">
              <template>
                <fx-output ref="."></fx-output>
              </template>
            </fx-repeat>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const outer = el.querySelector('#r-outer');
    const outerItems = outer.querySelectorAll(':scope > fx-repeatitem');
    expect(outerItems.length).to.equal(2);

    outerItems.forEach(item => {
      const innerRepeat = item.querySelector('fx-repeat');
      expect(innerRepeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(3);
    });
  });

  it('JSON repeat: caps initial materialization and reveals via sentinel', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="json">
            { "items": [ {"id":1}, {"id":2}, {"id":3}, {"id":4}, {"id":5} ] }
          </fx-instance>
        </fx-model>
        <div id="jscroller" style="height:100px;overflow:auto;">
          <fx-repeat id="r-json" ref="?items" size="2">
            <template>
              <div style="height:40px;">
                <fx-output ref="?id"></fx-output>
              </div>
            </template>
          </fx-repeat>
        </div>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('#r-json');
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(2);
    expect(repeat.nodeset.length).to.equal(5);

    const scroller = el.querySelector('#jscroller');
    scroller.scrollTop = scroller.scrollHeight;

    await waitUntil(() => repeat.querySelectorAll(':scope > fx-repeatitem').length === 4);
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(4);
  });
});
