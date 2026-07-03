/* eslint-disable no-unused-expressions */
import {
  html, oneEvent, fixtureSync, expect, waitUntil,
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

  it('has inert state', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-switch>
          <fx-case id="one">
            some exclusive content
          </fx-case>
          <fx-case id="two">
            some further content
          </fx-case>
          <fx-case id="three">
            some completely unneeded content
          </fx-case>
        </fx-switch>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    const cases = el.querySelectorAll('fx-case');
    expect(cases[0].inert).to.be.false;
    expect(cases[1].hasAttribute('inert')).to.be.true
    expect(cases[2].hasAttribute('inert')).to.be.true;
  });

  it('toggles inert state', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-toggle case="three" event="ready"></fx-toggle>
        <fx-switch>
          <fx-case id="one">
            some exclusive content
          </fx-case>
          <fx-case id="two">
            some further content
          </fx-case>
          <fx-case id="three">
            some completely unneeded content
          </fx-case>
        </fx-switch>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');

    const cases = el.querySelectorAll('fx-case');

    expect(cases[0].inert).to.be.true;
    expect(cases[1].hasAttribute('inert')).to.be.true
    expect(cases[2].hasAttribute('inert')).to.be.false;
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

  it('refreshes children of case loaded from src', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      headers: { get: () => 'text/html' },
      text: async () => `
        <fx-case>
          <fx-output id="loaded-output" ref="item"></fx-output>
        </fx-case>
      `,
    });

    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data><item>hello</item></data>
          </fx-instance>
        </fx-model>
        <fx-trigger id="t-load">
          <fx-toggle case="c-loaded"></fx-toggle>
        </fx-trigger>
        <fx-switch>
          <fx-case id="c-first">static</fx-case>
          <fx-case id="c-loaded" src="mock://irrelevant.html"></fx-case>
        </fx-switch>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const trigger = el.querySelector('#t-load');
    trigger.performActions();

    await waitUntil(
      () => el.querySelector('#loaded-output')?.value === 'hello',
      'loaded output should have value after src case is selected',
      { timeout: 2000 },
    );

    globalThis.fetch = originalFetch;
  });

  it('wires ARIA tab semantics when appearance="tabs"', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-switch appearance="tabs">
          <fx-trigger>
            <button>Page one</button>
            <fx-toggle case="one"></fx-toggle>
          </fx-trigger>
          <fx-trigger>
            <button>Page two</button>
            <fx-toggle case="two"></fx-toggle>
          </fx-trigger>

          <fx-case id="one">content one</fx-case>
          <fx-case id="two">content two</fx-case>
        </fx-switch>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const tablist = el.querySelector('fx-switch').shadowRoot.querySelector('[role="tablist"]');
    expect(tablist).to.exist;

    const triggers = el.querySelectorAll('fx-trigger');
    const tabOne = triggers[0].querySelector('button');
    const tabTwo = triggers[1].querySelector('button');
    const caseOne = el.querySelector('#one');
    const caseTwo = el.querySelector('#two');

    expect(tabOne.getAttribute('role')).to.equal('tab');
    expect(tabOne.getAttribute('aria-selected')).to.equal('true');
    expect(tabOne.getAttribute('tabindex')).to.equal('0');
    expect(tabOne.getAttribute('aria-controls')).to.equal('one');

    expect(tabTwo.getAttribute('role')).to.equal('tab');
    expect(tabTwo.getAttribute('aria-selected')).to.equal('false');
    expect(tabTwo.getAttribute('tabindex')).to.equal('-1');

    expect(caseOne.getAttribute('role')).to.equal('tabpanel');
    expect(caseOne.getAttribute('aria-labelledby')).to.equal(tabOne.id);
    expect(caseTwo.getAttribute('role')).to.equal('tabpanel');
    expect(caseTwo.getAttribute('aria-labelledby')).to.equal(tabTwo.id);

    await triggers[1].performActions();

    expect(tabOne.getAttribute('aria-selected')).to.equal('false');
    expect(tabOne.getAttribute('tabindex')).to.equal('-1');
    expect(tabTwo.getAttribute('aria-selected')).to.equal('true');
    expect(tabTwo.getAttribute('tabindex')).to.equal('0');
  });

  it('moves focus and activates case with arrow keys in tabs mode', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-switch appearance="tabs">
          <fx-trigger>
            <button>Page one</button>
            <fx-toggle case="one"></fx-toggle>
          </fx-trigger>
          <fx-trigger>
            <button>Page two</button>
            <fx-toggle case="two"></fx-toggle>
          </fx-trigger>

          <fx-case id="one">content one</fx-case>
          <fx-case id="two">content two</fx-case>
        </fx-switch>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const fxSwitch = el.querySelector('fx-switch');
    const triggers = el.querySelectorAll('fx-trigger');
    const tabOne = triggers[0].querySelector('button');
    const tabTwo = triggers[1].querySelector('button');

    const keydown = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      composed: true,
    });
    Object.defineProperty(keydown, 'target', { value: tabOne });
    fxSwitch.dispatchEvent(keydown);

    await waitUntil(
      () => tabTwo.getAttribute('aria-selected') === 'true',
      'second tab should become selected after ArrowRight',
    );

    expect(tabOne.getAttribute('aria-selected')).to.equal('false');
    expect(el.querySelector('#two').classList.contains('selected-case')).to.be.true;
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
