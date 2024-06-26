import {
  html, fixtureSync, expect, oneEvent,
} from '@open-wc/testing';

import '../src/fx-instance.js';
import '../src/ui/fx-container.js';
import '../src/fx-bind.js';

describe('refresh Tests', () => {
  it('refresh renders correct state initially', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a>A</a>
              <b>B</b>
              <c>C</c>
            </data>
          </fx-instance>
          <fx-bind ref="a" readonly="string-length(../b) > 1" required="../b = 'B'"></fx-bind>
          <fx-bind ref="b" required="../c = 'C'"></fx-bind>
          <fx-bind ref="c" relevant="../b = 'B'"></fx-bind>
        </fx-model>
        <fx-group collapse="true">
          <h1>
            Recalculation
          </h1>
          <div class="display">
            <fx-output id="output1" ref="a">
              <label slot="label">a:</label>
            </fx-output>
            <fx-output id="output2" ref="b">
              <fx-label slot="label">b:</fx-label>
            </fx-output>
            <fx-output id="output3" ref="c">
              <fx-label slot="label">c:</fx-label>
            </fx-output>
          </div>

          <fx-control ref="a" update-event="input">
            <label>A</label>
          </fx-control>
          <fx-control ref="b" update-event="input">
            <label>B</label>
          </fx-control>
          <fx-control ref="c" update-event="input">
            <label>C</label>
          </fx-control>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    expect(el.getModel().modelItems.length).to.equal(3);
    const c1 = el.querySelector('#output1');
    expect(c1).to.exist;
    expect(c1.modelItem).to.exist;
    expect(c1.modelItem.value).to.equal('A');
    expect(c1.modelItem.boundControls).to.exist;
    expect(c1.modelItem.boundControls.length).to.equal(2);

    const c2 = el.querySelector('#output2');
    expect(c2.modelItem.value).to.equal('B');
    expect(c2.modelItem.boundControls).to.exist;
    expect(c2.modelItem.boundControls.length).to.equal(2);

    const c3 = el.querySelector('#output3');
    expect(c3.modelItem.value).to.equal('C');
    expect(c3.modelItem.boundControls).to.exist;
    expect(c3.modelItem.boundControls.length).to.equal(2);
  });

  it('refresh renders correct state after update of control', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a>A</a>
              <b>B</b>
              <c>C</c>
            </data>
          </fx-instance>
          <fx-bind ref="a" readonly="string-length(../b) > 1" required="../b = 'B'"></fx-bind>
          <fx-bind ref="b" required="../c = 'C'"></fx-bind>
          <fx-bind ref="c" relevant="../b = 'B'"></fx-bind>
        </fx-model>
        <fx-group collapse="true">
          <h1>
            Recalculation
          </h1>
          <div class="display">
            <fx-output id="output1" ref="a">
              <label slot="label">a:</label>
            </fx-output>
            <fx-output id="output2" ref="b">
              <fx-label slot="label">b:</fx-label>
            </fx-output>
            <fx-output id="output3" ref="c">
              <fx-label slot="label">c:</fx-label>
            </fx-output>
          </div>

          <fx-control ref="a" update-event="input">
            <label>A</label>
          </fx-control>
          <fx-control id="b" ref="b" update-event="input">
            <label>B</label>
          </fx-control>
          <fx-control ref="c" update-event="input">
            <label>C</label>
          </fx-control>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    /*
    const c2 = el.querySelector('#output2');
    expect(c2.modelItem.value).to.equal('B');
*/

    const b = el.querySelector('#b');
    b.modelItem.value = 'Bs';
    el.getModel().updateModel();
    el.refresh(true);

    const c1 = el.querySelector('#output1');
    expect(c1.modelItem.value).to.equal('A');
    expect(c1.modelItem.boundControls).to.exist;
    expect(c1.modelItem.boundControls.length).to.equal(2);

    // check states
    expect(c1.modelItem.readonly).to.be.true;
    expect(c1.modelItem.required).to.be.false;
    // check control states
    expect(c1.hasAttribute('readonly')).to.be.true;

    const c2 = el.querySelector('#output2');
    expect(c2.modelItem.value).to.equal('Bs');
    expect(c2.modelItem.boundControls).to.exist;
    expect(c2.modelItem.boundControls.length).to.equal(2);

    expect(c2.modelItem.required).to.be.true;
    expect(c2.hasAttribute('required')).to.be.true;

    const c3 = el.querySelector('#output3');
    expect(c3.modelItem.value).to.equal('C');
    expect(c3.modelItem.boundControls).to.exist;
    expect(c3.modelItem.boundControls.length).to.equal(2);

    expect(c3.modelItem.relevant).to.be.false;
  });

  it('refreshes bound fx-switch when page changes', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <page>page2</page>
            </data>
          </fx-instance>
        </fx-model>

        <fx-trigger id="changePage">
          <button>change</button>
          <fx-setvalue ref="page">page3</fx-setvalue>
        </fx-trigger>

        <fx-switch class="second" ref="page">
          <fx-case id="page1" name="page1">
            <h2>Page1</h2>
          </fx-case>
          <fx-case id="page2" name="page2">
            <h2>Page 2</h2>
          </fx-case>
          <fx-case id="page3" name="page3">
            <h2>Page 3</h2>
          </fx-case>
        </fx-switch>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const sw = el.querySelector('fx-switch');
    expect(sw.modelItem.value).to.equal('page2');

    const b = el.querySelector('#changePage');
    await b.performActions();

    expect(sw.modelItem.value).to.equal('page3');
    expect(sw.modelItem.boundControls).to.exist;
    expect(sw.modelItem.boundControls.length).to.equal(1);

    const page1 = el.querySelector('#page1');
    expect(page1.classList.contains('selected-case')).to.be.false;
    const page2 = el.querySelector('#page2');
    expect(page2.classList.contains('selected-case')).to.be.false;
    const page3 = el.querySelector('#page3');
    expect(page3.classList.contains('selected-case')).to.be.true;
  });

  it('registers fx-repeat items in modelitem', async () => {
    const el = await fixtureSync(html`
      <fx-fore id="todo">
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2021-11-04">Pick up Milk</task>
              <task complete="false" due="2021-11-15">Make tutorial part 1</task>
              <template>
                <task complete="false" due="">new task</task>
              </template>
              <count>1</count>
              <showclosed>false</showclosed>
            </data>
          </fx-instance>
          <fx-bind ref="task" relevant="../showclosed='true' or ./@complete='false'">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>

        <h1>Todo</h1>
        <fx-trigger class="btn add">
          <button>+</button>
          <fx-insert ref="task" at="1" position="before" origin="template/task"></fx-insert>
        </fx-trigger>

        <div class="info">
          You have {count(instance()/task[@complete='true'])} completed tasks
        </div>

        <div class="info open">
          {if(count(instance()/task[@complete='false'])!=0) then "You have " ||
          count(instance()/task[@complete='false']) || " open tasks" else ""}
        </div>

        <div class="info big">
          {if(count(instance()/task[@complete='false'])=0) then "You're all done!" else ""}
        </div>
        <fx-repeat id="task" ref="task">
          <template>
            <div>
              <fx-control ref="@complete" value-prop="checked" update-event="input">
                <input class="widget" type="checkbox" />
              </fx-control>
              <fx-control class="{@complete} task" id="task" ref="."></fx-control>
              <fx-control ref="@due">
                <input type="date" />
              </fx-control>
              <fx-trigger class="btn delete">
                <button>x</button>
                <fx-delete ref="."></fx-delete>
              </fx-trigger>
            </div>
          </template>
        </fx-repeat>
        <fx-control id="switch" ref="showclosed" value-prop="checked" update-event="input">
          <label for="showcompleted">show completed</label>
          <input id="showcompleted" type="checkbox" class="widget" />
        </fx-control>
        <trigger>
          <button>refresh</button>
          <fx-refresh></fx-refresh>
        </trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const items = el.querySelectorAll('fx-repeatitem');
    expect(items[0]).to.exist;
    expect(items[0].modelItem).to.exist;
    expect(items[0].modelItem.boundControls).to.exist;
    expect(items[0].modelItem.boundControls.length).to.equal(2);
    expect(items[0].modelItem.boundControls.includes(items[0]));

    expect(items[1]).to.exist;
    expect(items[1].modelItem).to.exist;
    expect(items[1].modelItem.boundControls).to.exist;
    expect(items[0].modelItem.boundControls.length).to.equal(2);
    expect(items[0].modelItem.boundControls.includes(items[0]));

    const task = el.querySelectorAll('.task');
    expect(task[0].modelItem.boundControls.includes(task));
    expect(task[1].modelItem.boundControls.includes(task));

    /*
    const b = el.querySelector('#changePage');
   await b.performActions();

    const page1 = el.querySelector('#page1');
    expect(page1.classList.contains('selected-case')).to.be.false;
    const page2 = el.querySelector('#page2');
    expect(page2.classList.contains('selected-case')).to.be.false;
    const page3 = el.querySelector('#page3');
    expect(page3.classList.contains('selected-case')).to.be.true;
*/
  });
});
