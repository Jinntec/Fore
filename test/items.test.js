/* eslint-disable no-unused-expressions */
import { html, fixture, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('fx-items tests', () => {
  it('renders group of checkboxes for each bound item with selected state', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <listitem>strawberry orange</listitem>
              <fruit value="apple">Apple</fruit>
              <fruit value="orange">Orange</fruit>
              <fruit value="strawberry">Strawberry</fruit>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <fx-control ref="listitem">
            <fx-items ref="instance('default')//fruit" class="widget">
              <template>
                <span class="fx-checkbox">
                  <input id="check" name="fruit" type="checkbox" value="{@value}" />
                  <label>{.}</label>
                </span>
              </template>
            </fx-items>
          </fx-control>

          <span id="listitem">{listitem}</span>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const lItem = document.getElementById('listitem');
    expect(lItem.innerText).to.be.equal('strawberry orange');

    const checkboxes = el.querySelectorAll('input');
    expect(checkboxes.length === 3);
    console.log('checkboxes', checkboxes);
    expect(checkboxes[0].value).to.equal('apple');
    expect(checkboxes[0].checked).to.be.false;
    expect(checkboxes[1].value).to.equal('orange');
    expect(checkboxes[1].checked).to.be.true;
    expect(checkboxes[2].value).to.equal('strawberry');
    expect(checkboxes[2].checked).to.be.true;
  });

  it('updates value when a checkbox is clicked', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <listitem>strawberry orange</listitem>
              <fruit value="apple">Apple</fruit>
              <fruit value="orange">Orange</fruit>
              <fruit value="strawberry">Strawberry</fruit>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <fx-control ref="listitem">
            <fx-items ref="instance('default')//fruit" class="widget">
              <template>
                <span class="fx-checkbox">
                  <input id="check" name="fruit" type="checkbox" value="{@value}" />
                  <label>{.}</label>
                </span>
              </template>
            </fx-items>
          </fx-control>

          <span id="listitem">{listitem}</span>
        </fx-group>
      </fx-fore>
    `);

    // await oneEvent(el, 'ready');

    const checkboxes = el.querySelectorAll('input');
    console.log('checkboxes', checkboxes);

    checkboxes[0].click();

    await oneEvent(el, 'refresh-done');

    expect(checkboxes[0].checked).to.be.true;
    expect(checkboxes[1].checked).to.be.true;
    expect(checkboxes[2].checked).to.be.true;
  });

  it('displays expected values', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model-1">
          <fx-instance
            id="default"
            src="/base/test/ling-checkboxes.xml"
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
          ></fx-instance>

          <fx-instance id="i-functions" src="/base/test/functions.xml"></fx-instance>
        </fx-model>
        <fx-control ref="//m/@function" update-event="input">
          <fx-items ref="instance('i-functions')//option" class="widget">
            <template>
              <span class="fx-checkbox">
                <input id="check" name="option" type="checkbox" value="{@xml:id}" />
                <label>{.}</label>
              </span>
            </template>
          </fx-items>
        </fx-control>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const checkboxes = el.querySelectorAll('input');

    expect(checkboxes.length).to.equal(11);
    expect(checkboxes[0].checked).to.be.false;
    expect(checkboxes[1].checked).to.be.true;
    expect(checkboxes[2].checked).to.be.false;
    expect(checkboxes[3].checked).to.be.true;
    expect(checkboxes[4].checked).to.be.true;
    expect(checkboxes[5].checked).to.be.false;
    expect(checkboxes[6].checked).to.be.true;
    expect(checkboxes[7].checked).to.be.false;
    expect(checkboxes[8].checked).to.be.false;
    expect(checkboxes[9].checked).to.be.false;
    expect(checkboxes[10].checked).to.be.false;

    const control = el.querySelector('fx-control');
    expect(control.value).to.equal('VAdj AgtNoun ActNoun PropN');
    expect(control.modelItem.value).to.equal('VAdj AgtNoun ActNoun PropN');
  });

  it('updates value when item is changed', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model-1">
          <fx-instance
            id="default"
            src="/base/test/ling-checkboxes.xml"
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
          ></fx-instance>

          <fx-instance id="i-functions" src="/base/test/functions.xml"></fx-instance>
        </fx-model>
        <fx-control ref="//m/@function" update-event="input">
          <fx-items ref="instance('i-functions')//option" class="widget">
            <template>
              <span class="fx-checkbox">
                <input id="check" name="option" type="checkbox" value="{@xml:id}" />
                <label>{.}</label>
              </span>
            </template>
          </fx-items>
        </fx-control>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const checkboxes = el.querySelectorAll('input');

    checkboxes[1].click();

    expect(checkboxes.length).to.equal(11);
    expect(checkboxes[0].checked).to.be.false;
    expect(checkboxes[1].checked).to.be.false;
    expect(checkboxes[2].checked).to.be.false;
    expect(checkboxes[3].checked).to.be.true;
    expect(checkboxes[4].checked).to.be.true;
    expect(checkboxes[5].checked).to.be.false;
    expect(checkboxes[6].checked).to.be.true;
    expect(checkboxes[7].checked).to.be.false;
    expect(checkboxes[8].checked).to.be.false;
    expect(checkboxes[9].checked).to.be.false;
    expect(checkboxes[10].checked).to.be.false;

    const control = el.querySelector('fx-control');
    expect(control.value).to.equal('AgtNoun ActNoun PropN');
    expect(control.modelItem.value).to.equal('AgtNoun ActNoun PropN');
  });

  it('works when checkbox label is clicked', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model-1">
          <fx-instance
            id="default"
            src="/base/test/ling-checkboxes.xml"
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
          ></fx-instance>

          <fx-instance id="i-functions" src="/base/test/functions.xml"></fx-instance>
        </fx-model>
        <fx-control ref="//m/@function" update-event="input">
          <fx-items ref="instance('i-functions')//option" class="widget">
            <template>
              <span class="fx-checkbox">
                <input id="check" name="option" type="checkbox" value="{@xml:id}" />
                <label>{.}</label>
              </span>
            </template>
          </fx-items>
        </fx-control>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    let checkboxes = el.querySelectorAll('input');
    expect(checkboxes.length).to.equal(11);
    expect(checkboxes[0].checked).to.equal(false, 'Checkbox #0 should be unchecked initially');
    expect(checkboxes[1].checked).to.equal(true, 'Checkbox #1 should be checked initially');
    expect(checkboxes[2].checked).to.equal(false, 'Checkbox #2 should be unchecked initially');
    expect(checkboxes[3].checked).to.equal(true, 'Checkbox #3 should be checked initially');
    expect(checkboxes[4].checked).to.equal(true, 'Checkbox #4 should be checked initially');
    expect(checkboxes[5].checked).to.equal(false, 'Checkbox #5 should be unchecked initially');
    expect(checkboxes[6].checked).to.equal(true, 'Checkbox #6 should be checked initially');
    expect(checkboxes[7].checked).to.equal(false, 'Checkbox #7 should be unchecked initially');
    expect(checkboxes[8].checked).to.equal(false, 'Checkbox #8 should be unchecked initially');
    expect(checkboxes[9].checked).to.equal(false, 'Checkbox #9 should be unchecked initially');
    expect(checkboxes[10].checked).to.equal(false, 'Checkbox #10 should be unchecked initially');

    const labels = el.querySelectorAll('label');

    labels[2].click();
    checkboxes = el.querySelectorAll('input');

    expect(checkboxes.length).to.equal(11);
    expect(checkboxes[0].checked).to.equal(
      false,
      'Checkbox #0 should be unchecked after the click?',
    );
    expect(checkboxes[1].checked).to.equal(true, 'Checkbox #1 should be checked after the click');
    expect(checkboxes[2].checked).to.equal(true, 'Checkbox #2 should be checked after the click');
    expect(checkboxes[3].checked).to.equal(true, 'Checkbox #3 should be checked after the click');
    expect(checkboxes[4].checked).to.equal(true, 'Checkbox #4 should be checked after the click');
    expect(checkboxes[5].checked).to.equal(
      false,
      'Checkbox #5 should be unchecked after the click',
    );
    expect(checkboxes[6].checked).to.equal(true, 'Checkbox #6 should be checked after the click');
    expect(checkboxes[7].checked).to.equal(
      false,
      'Checkbox #7 should be unchecked after the click',
    );
    expect(checkboxes[8].checked).to.equal(
      false,
      'Checkbox #8 should be unchecked after the click',
    );
    expect(checkboxes[9].checked).to.equal(
      false,
      'Checkbox #9 should be unchecked after the click',
    );
    expect(checkboxes[10].checked).to.equal(
      false,
      'Checkbox #10 should be unchecked after the click',
    );

    const control = el.querySelector('fx-control');
    expect(control.value).to.equal('VAdj Part AgtNoun ActNoun PropN');
    expect(control.modelItem.value).to.equal('VAdj Part AgtNoun ActNoun PropN');
  });

  it('works with JSON data', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model-1">
          <fx-instance>
            <data>
              <selected></selected>
            </data>
          </fx-instance>
          <fx-instance id="list" type="json">
            [ { "name": "Akklamation", "value": "https://www.eagle-network.eu/voc/typeins/lod/73" },
            { "name": "Adnuntiatio", "value": "https://www.eagle-network.eu/voc/typeins/lod/113" },
            { "name": "Assignationsinschrift", "value":
            "https://www.eagle-network.eu/voc/typeins/lod/116" } ]
          </fx-instance>
        </fx-model>
        <fx-control ref="selected" update-event="input">
          <fx-items ref="instance('list')?*" class="widget">
            <template>
              <span class="fx-checkbox">
                <input id="check" name="option" type="checkbox" value="{value}" />
                <label>{name}</label>
              </span>
            </template>
          </fx-items>
        </fx-control>
        <fx-output ref="selected"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const checkboxes = el.querySelectorAll('input');
    expect(checkboxes.length).to.equal(3);
    expect(checkboxes[0].value).to.equal('https://www.eagle-network.eu/voc/typeins/lod/73');
    expect(checkboxes[1].value).to.equal('https://www.eagle-network.eu/voc/typeins/lod/113');
    expect(checkboxes[2].value).to.equal('https://www.eagle-network.eu/voc/typeins/lod/116');

    const labels = el.querySelectorAll('label');
    expect(labels.length).to.equal(3);
    expect(labels[0].textContent).to.equal('Akklamation');
    expect(labels[1].textContent).to.equal('Adnuntiatio');
    expect(labels[2].textContent).to.equal('Assignationsinschrift');
  });

  it('works with JSON data when label clicked', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model-1">
          <fx-instance>
            <data>
              <selected></selected>
            </data>
          </fx-instance>
          <fx-instance id="list" type="json">
            [ { "name": "Akklamation", "value": "https://www.eagle-network.eu/voc/typeins/lod/73" },
            { "name": "Adnuntiatio", "value": "https://www.eagle-network.eu/voc/typeins/lod/113" },
            { "name": "Assignationsinschrift", "value":
            "https://www.eagle-network.eu/voc/typeins/lod/116" } ]
          </fx-instance>
        </fx-model>
        <fx-control ref="selected" update-event="input">
          <fx-items ref="instance('list')?*" class="widget">
            <template>
              <span class="fx-checkbox">
                <input id="check" name="option" type="checkbox" value="{value}" />
                <label>{name}</label>
              </span>
            </template>
          </fx-items>
        </fx-control>
        <fx-output ref="selected"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const labels = el.querySelectorAll('label');
    labels[1].click();

    const output = el.querySelector('fx-output');
    expect(output.value).to.equal('https://www.eagle-network.eu/voc/typeins/lod/113');
  });
  it('has correct initial checkbox state', async () => {
    // language=HTML format=false
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model-1">
          <fx-instance>
            <data>
              <selected
                >https://www.eagle-network.eu/voc/typeins/lod/73
                https://www.eagle-network.eu/voc/typeins/lod/113</selected
              >
            </data>
          </fx-instance>
          <fx-instance id="list" type="json">
            [ { "name": "Akklamation", "value": "https://www.eagle-network.eu/voc/typeins/lod/73" },
            { "name": "Adnuntiatio", "value": "https://www.eagle-network.eu/voc/typeins/lod/113" },
            { "name": "Assignationsinschrift", "value":
            "https://www.eagle-network.eu/voc/typeins/lod/116" } ]
          </fx-instance>
        </fx-model>
        <fx-control ref="selected" update-event="input">
          <fx-items ref="instance('list')?*" class="widget">
            <template>
              <span class="fx-checkbox">
                <input id="check" name="option" type="checkbox" value="{value}" />
                <label>{name}</label>
              </span>
            </template>
          </fx-items>
        </fx-control>
        <fx-output ref="selected"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('fx-output');
    const normalizedOutput = output.value.replace(/\s+/g, ' ').trim();

    // Expected normalized value
    const expectedValue =
      'https://www.eagle-network.eu/voc/typeins/lod/73 https://www.eagle-network.eu/voc/typeins/lod/113';

    expect(normalizedOutput).to.equal(expectedValue);

    /*
    expect(output.value).to.equal(
      'https://www.eagle-network.eu/voc/typeins/lod/73 https://www.eagle-network.eu/voc/typeins/lod/113',
    );
*/

    const checkboxes = el.querySelectorAll('input');
    expect(checkboxes[0].checked).to.be.true;
    expect(checkboxes[1].checked).to.be.true;
  });

  it('updates after submission replace=instance', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="default" src="/base/test/data/typeins-de.json" type="json">
            <div>Hello</div>
          </fx-instance>
          <fx-instance id="vars">
            <data>
              <selected></selected>
            </data>
          </fx-instance>
          <fx-submission id="switch-lang" method="get" replace="instance" instance="default">
          </fx-submission>
        </fx-model>

        <h1>i18n</h1>
        <p>
          This example uses a single instance which holds the current language. It simply loads one
          language as the default with <code>src</code> and switches between different languages by
          exchanging the instance with a submission.
        </p>
        <fx-group>
          <fx-control ref="instance('vars')/selected">
            <label>Select</label>
            <fx-items ref="instance('default')?*" class="widget">
              <template>
                <div class="fx-checkbox">
                  <input type="radio" name="group" value="{value}" />
                  <label>{name}</label>
                </div>
              </template>
            </fx-items>
          </fx-control>
          {instance('vars')/selected}
        </fx-group>

        <fx-trigger id="de">
          <button>DE</button>
          <fx-send submission="switch-lang" url="/base/test/data/typeins-de.json">de</fx-send>
        </fx-trigger>
        <fx-trigger id="en">
          <button>EN</button>
          <fx-send submission="switch-lang" url="/base/test/data/typeins-en.json">en</fx-send>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    const button = el.querySelector('#en button');
    button.click();
    await oneEvent(el, 'refresh-done');

    const labels = el.querySelectorAll('.fx-checkbox label');
    expect(labels[0].textContent).to.equal('Letter');
    expect(labels[1].textContent).to.equal('Prayer');
    expect(labels[2].textContent).to.equal('Calendar');
    expect(labels[3].textContent).to.equal('Directory');
  });
});
