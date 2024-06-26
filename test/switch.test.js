/* eslint-disable no-unused-expressions */
import {
  html, oneEvent, fixtureSync, expect,
} from '@open-wc/testing';

import '../index.js';

describe('fx-switch Tests', () => {
  it('shows first case by default', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-trigger label="page 1">
          <paper-button>toggle page 1</paper-button>
          <fx-toggle case="one"></fx-toggle>
        </fx-trigger>

        <fx-trigger label="page 2" raised="raised">
          <paper-button>toggle page 2</paper-button>
          <fx-toggle case="two"></fx-toggle>
        </fx-trigger>

        <fx-trigger label="page 3" raised="raised">
          <paper-button>toggle page 3</paper-button>
          <fx-toggle case="three"></fx-toggle>
        </fx-trigger>

        <fx-switch>
          <fx-case id="one" name="page1">
            some exclusive content
          </fx-case>
          <fx-case id="two" name="page2">
            some further content
          </fx-case>
          <fx-case id="three" name="page3">
            some completely unneeded content
          </fx-case>
        </fx-switch>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const cases = el.querySelectorAll('fx-case');
    expect(cases[0].classList.contains('selected-case')).to.be.true;
    expect(cases[1].classList.contains('selected-case')).to.be.false;
    expect(cases[2].classList.contains('selected-case')).to.be.false;

    // expect(model.modelItems[5].value).to.equal('2019-01-04');
  });

  it('toggles case by action', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-trigger label="page 1">
          <paper-button>toggle page 1</paper-button>
          <fx-toggle case="one"></fx-toggle>
        </fx-trigger>

        <fx-trigger label="page 2" raised="raised">
          <paper-button>toggle page 2</paper-button>
          <fx-toggle case="two"></fx-toggle>
        </fx-trigger>

        <fx-trigger label="page 3" raised="raised">
          <paper-button>toggle page 3</paper-button>
          <fx-toggle case="three"></fx-toggle>
        </fx-trigger>

        <fx-switch>
          <fx-case id="one" name="page1">
            some exclusive content
          </fx-case>
          <fx-case id="two" name="page2">
            some further content
          </fx-case>
          <fx-case id="three" name="page3">
            some completely unneeded content
          </fx-case>
        </fx-switch>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const trigger = el.querySelectorAll('fx-trigger');

    await trigger[1].performActions();

    const cases = el.querySelectorAll('fx-case');
    expect(cases[0].classList.contains('selected-case')).to.be.false;
    expect(cases[1].classList.contains('selected-case')).to.be.true;
    expect(cases[2].classList.contains('selected-case')).to.be.false;
  });

  it('dispatches initial select event', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <page1></page1>
            </data>
          </fx-instance>
        </fx-model>
        <fx-trigger id="t-one" label="page 1">
          <paper-button>toggle page 1</paper-button>
          <fx-toggle case="one"></fx-toggle>
        </fx-trigger>
        
        <fx-switch>
          <fx-case id="one" name="page1">
            <fx-setvalue ref="page1" event="select">selected</fx-setvalue>
          </fx-case>
          <fx-case id="two" name="page2">
            <fx-setvalue ref="item" event="select">page2</fx-setvalue>
            some further content
          </fx-case>
          <fx-case id="three" name="page3">
            some completely unneeded content
          </fx-case>
        </fx-switch>
        <fx-output ref="page1"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const trigger1 = el.querySelector('#t-one');
    trigger1.performActions();

    const output = el.querySelector('fx-output');
    expect(output.value).to.equal('selected');
  });

  it('dispatches select/deselect events after toggle', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <page1></page1>
              <page2></page2>
            </data>
          </fx-instance>
        </fx-model>
        <fx-trigger id="t-one" label="page 1">
          <paper-button>toggle page 2</paper-button>
          <fx-toggle case="two"></fx-toggle>
        </fx-trigger>
        
        <fx-switch>
          <fx-case id="one" name="page1">
            <fx-setvalue ref="page1" event="select">deselected</fx-setvalue>
          </fx-case>
          <fx-case id="two" name="page2">
            <fx-setvalue ref="page2" event="select">selected</fx-setvalue>
            some further content
          </fx-case>
          <fx-case id="three" name="page3">
            some completely unneeded content
          </fx-case>
        </fx-switch>
        <fx-output ref="page1"></fx-output>
        <fx-output ref="page2"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const trigger = el.querySelector('#t-one');
    await trigger.performActions();

    const output = el.querySelectorAll('fx-output');
    expect(output[0].value).to.equal('deselected');
    expect(output[1].value).to.equal('selected');
  });

  it('activates case that matches bound value and dispatches select event', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <page  select="">page3</page>
            </data>
          </fx-instance>
        </fx-model>

        <fx-control ref="page" update-event="change">
          <label>select page</label>
          <select class="widget">
            <option>page1</option>
            <option>page2</option>
            <option>page3</option>
          </select>
        </fx-control>

        <fx-switch ref="page">
          <fx-case name="page1">
            <h2>Page1</h2>
          </fx-case>
          <fx-case name="page2">
            <h2>Page 2</h2>
          </fx-case>
          <fx-case name="page3">
            <fx-setvalue ref="@select" event="select">selected</fx-setvalue>
            <h2>Page 3</h2>
          </fx-case>
        </fx-switch>
        <fx-output ref="page/@select"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const cases = el.querySelectorAll('fx-case');
    expect(cases[0].classList.contains('selected-case')).to.be.false;
    expect(cases[1].classList.contains('selected-case')).to.be.false;
    expect(cases[2].classList.contains('selected-case')).to.be.true;

    const out = el.querySelector('fx-output');
    expect(out.value).to.equal('selected');
  });

  it('toggles on event', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <page>page3</page>
              <foo></foo>
            </data>
          </fx-instance>
        </fx-model>

        <fx-control ref="page" update-event="change">
          <label>select page</label>
          <fx-toggle case="page3" event="value-changed"></fx-toggle>
        </fx-control>

        <fx-switch ref="page">
          <fx-case name="page1">
            <h2>Page1</h2>
          </fx-case>
          <fx-case name="page2">
            <h2>Page 2</h2>
          </fx-case>
          <fx-case id="page3" name="page3">
            <h2>Page 3</h2>
          </fx-case>
        </fx-switch>
      </fx-fore>
    `);

    const control = el.querySelector('fx-control');
    control.setValue('bar');

    await oneEvent(el, 'refresh-done');

    const cases = el.querySelectorAll('fx-case');
    expect(cases[0].classList.contains('selected-case')).to.be.false;
    expect(cases[1].classList.contains('selected-case')).to.be.false;
    expect(cases[2].classList.contains('selected-case')).to.be.true;
  });

  it('refreshes just the default case', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <item1>a bound item</item1>
              <item2>second bound item</item2>
              <item3>third bound item</item3>
            </data>
          </fx-instance>
        </fx-model>

        <fx-trigger label="page 1" class="orange">
          <paper-button>toggle page 1</paper-button>
          <fx-toggle case="one"></fx-toggle>
        </fx-trigger>

        <fx-trigger label="page 2" raised="raised" class="green">
          <paper-button>toggle page 2</paper-button>
          <fx-toggle case="two"></fx-toggle>
        </fx-trigger>

        <fx-trigger label="page 3" raised="raised" class="blue">
          <paper-button>toggle page 3</paper-button>
          <fx-toggle case="three"></fx-toggle>
        </fx-trigger>

        <fx-switch>
          <fx-case id="one" class="orange">
            some exclusive content
            <fx-control ref="item1">
              <label>Item1</label>
            </fx-control>
          </fx-case>
          <fx-case id="two" class="green">
            some further content
            <fx-control ref="item2">
              <label>Item1</label>
            </fx-control>
          </fx-case>
          <fx-case id="three" class="blue">
            some completely unneeded content
            <fx-control ref="item3">
              <label>Item1</label>
            </fx-control>
          </fx-case>
        </fx-switch>
      </fx-fore>
    `);

    const control = el.querySelector('fx-control');
    control.setValue('bar');

    await oneEvent(el, 'refresh-done');

    const cases = el.querySelectorAll('fx-case');
    expect(cases[0].classList.contains('selected-case')).to.be.true;
    expect(cases[1].classList.contains('selected-case')).to.be.false;
    expect(cases[2].classList.contains('selected-case')).to.be.false;

    // check that only the first of conrols will have a value -> be initialized
    const control1 = el.querySelector('[ref="item1"]');
    expect(control1.value).to.equal('a bound item');

    const control2 = el.querySelector('[ref="item2"]');
    expect(control2.value).to.equal(null);

    const control3 = el.querySelector('[ref="item3"]');
    expect(control3.value).to.equal(null);
  });

/*
  it('refreshes second case when toggled', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-toggle event="model-construct-done" case="two"></fx-toggle>
          <fx-instance>
            <data>
              <item1>a bound item</item1>
              <item2>second bound item</item2>
              <item3>third bound item</item3>
            </data>
          </fx-instance>
        </fx-model>

        <fx-trigger label="page 1" class="orange">
          <paper-button>toggle page 1</paper-button>
          <fx-toggle case="one"></fx-toggle>
        </fx-trigger>

        <fx-trigger id="two" label="page 2" raised="raised" class="green">
          <paper-button>toggle page 2</paper-button>
          <fx-toggle case="two"></fx-toggle>
        </fx-trigger>

        <fx-trigger label="page 3" raised="raised" class="blue">
          <paper-button>toggle page 3</paper-button>
          <fx-toggle case="three"></fx-toggle>
        </fx-trigger>

        <fx-switch>
          <fx-case id="one" class="orange">
            some exclusive content
            <fx-control ref="item1">
              <label>Item1</label>
            </fx-control>
          </fx-case>
          <fx-case id="two" class="green">
            some further content
            <fx-control ref="item2">
              <label>Item1</label>
            </fx-control>
          </fx-case>
          <fx-case id="three" class="blue">
            some completely unneeded content
            <fx-control ref="item3">
              <label>Item1</label>
            </fx-control>
          </fx-case>
        </fx-switch>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control2 = el.querySelector('[ref="item2"]');
    expect(control2.value).to.equal('second bound item');

    const control3 = el.querySelector('[ref="item3"]');
    expect(control3.value).to.equal('');

  });
*/
});
