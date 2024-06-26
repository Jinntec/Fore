/* eslint-disable no-unused-expressions */
import {
  html, fixtureSync, expect, oneEvent,
} from '@open-wc/testing';

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

    const checkboxes = el.querySelectorAll('input');
    console.log('checkboxes', checkboxes);

    checkboxes[0].click();

    const listItem = document.getElementById('listitem');
    expect(listItem.textContent).to.equal('apple orange strawberry');

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
              xpath-default-namespace="http://www.tei-c.org/ns/1.0"></fx-instance>

          <fx-instance id="i-functions" src="/base/test/functions.xml" ></fx-instance>
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

          <fx-instance id="i-functions" src="/base/test/functions.xml" ></fx-instance>
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

          <fx-instance id="i-functions" src="/base/test/functions.xml" ></fx-instance>
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

    const labels = el.querySelectorAll('label');

    labels[2].click();

    const checkboxes = el.querySelectorAll('input');
    expect(checkboxes.length).to.equal(11);
    expect(checkboxes[0].checked).to.be.false;
    expect(checkboxes[1].checked).to.be.true;
    expect(checkboxes[2].checked).to.be.true;
    expect(checkboxes[3].checked).to.be.true;
    expect(checkboxes[4].checked).to.be.true;
    expect(checkboxes[5].checked).to.be.false;
    expect(checkboxes[6].checked).to.be.true;
    expect(checkboxes[7].checked).to.be.false;
    expect(checkboxes[8].checked).to.be.false;
    expect(checkboxes[9].checked).to.be.false;
    expect(checkboxes[10].checked).to.be.false;

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
            [
            {
            "name": "Akklamation",
            "value": "https://www.eagle-network.eu/voc/typeins/lod/73"
            },
            {
            "name": "Adnuntiatio",
            "value": "https://www.eagle-network.eu/voc/typeins/lod/113"
            },
            {
            "name": "Assignationsinschrift",
            "value": "https://www.eagle-network.eu/voc/typeins/lod/116"
            }
            ]
          </fx-instance>
        </fx-model>
        <fx-control ref="selected" update-event="input">
          <fx-items ref="instance('list')?*" class="widget">
            <template>
                  <span class="fx-checkbox">
                    <input id="check" name="option" type="checkbox" value="{value}"/>
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
            [
            {
            "name": "Akklamation",
            "value": "https://www.eagle-network.eu/voc/typeins/lod/73"
            },
            {
            "name": "Adnuntiatio",
            "value": "https://www.eagle-network.eu/voc/typeins/lod/113"
            },
            {
            "name": "Assignationsinschrift",
            "value": "https://www.eagle-network.eu/voc/typeins/lod/116"
            }
            ]
          </fx-instance>
        </fx-model>
        <fx-control ref="selected" update-event="input">
          <fx-items ref="instance('list')?*" class="widget">
            <template>
                  <span class="fx-checkbox">
                    <input id="check" name="option" type="checkbox" value="{value}"/>
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
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model-1">
          <fx-instance>
            <data>
              <selected>https://www.eagle-network.eu/voc/typeins/lod/73 https://www.eagle-network.eu/voc/typeins/lod/113</selected>
            </data>
          </fx-instance>
          <fx-instance id="list" type="json">
            [
            {
            "name": "Akklamation",
            "value": "https://www.eagle-network.eu/voc/typeins/lod/73"
            },
            {
            "name": "Adnuntiatio",
            "value": "https://www.eagle-network.eu/voc/typeins/lod/113"
            },
            {
            "name": "Assignationsinschrift",
            "value": "https://www.eagle-network.eu/voc/typeins/lod/116"
            }
            ]
          </fx-instance>
        </fx-model>
        <fx-control ref="selected" update-event="input">
          <fx-items ref="instance('list')?*" class="widget">
            <template>
                  <span class="fx-checkbox">
                    <input id="check" name="option" type="checkbox" value="{value}"/>
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
    expect(output.value).to.equal('https://www.eagle-network.eu/voc/typeins/lod/73 https://www.eagle-network.eu/voc/typeins/lod/113');

    const checkboxes = el.querySelectorAll('input');
    expect(checkboxes[0].checked).to.be.true;
    expect(checkboxes[1].checked).to.be.true;
  });
});
