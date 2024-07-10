/* eslint-disable no-unused-expressions */
import { html, fixture, expect, elementUpdated, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('fx-control with select tests', () => {
  it('preselects a select multiple', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <selected>1 3</selected>
            </data>
          </fx-instance>
          <fx-instance id="vars">
            <data>
              <item id="1">value1</item>
              <item id="2">value2</item>
              <item id="3">value3</item>
              <item id="4">value4</item>
              <item id="5">value5</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-control ref="instance()/selected">
          <input placeholder="put your Ids here"/>
        </fx-control>
        <fx-control ref="instance()/selected" class="{$vars/show-multiple}" value-prop="selectedOptions">
          <select class="widget" multiple="multiple" ref="instance('vars')/item" size="8">
            <template>
              <option value="{@id}">{.}</option>
            </template>
          </select>
        </fx-control>
        <div>{instance('vars')/selectedprojects}</div>
      </fx-fore>
    `);

    // await oneEvent(el, 'refresh-done');

    const options = el.querySelectorAll('option');
    expect(options).to.exist;
    expect(options.length).to.equal(5);

    const select = el.querySelector('select');
    expect(select.selectedOptions.length).to.equal(2);
    expect(select.selectedOptions[0].value).to.equal('1');
    expect(select.selectedOptions[1].value).to.equal('3');

    const control = el.querySelector('fx-control');
    expect (control.value).to.equal('1 3');
  });

  it('is creates a select with one option', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <item>foobar</item>
            </data>
          </fx-instance>
          <fx-instance id="second">
            <data>
              <option>option1</option>
            </data>
          </fx-instance>
        </fx-model>
        <fx-control ref="item">
          <select class="widget" ref="instance('second')/option">
            <template>
              <option value="{.}">{.}</option>
            </template>
          </select>
        </fx-control>
      </fx-fore>
    `);

    // await oneEvent(el, 'refresh-done');

    const select = el.querySelector('.widget');
    expect(select).to.exist;
    expect(select.children).to.exist;
    expect(select.children.length).to.equal(2);
    expect(select.children[0].nodeName).to.equal('TEMPLATE');
    expect(select.children[1].nodeName).to.equal('OPTION');
  });

  it('is creates a select with 3 options', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <item>foobar</item>
            </data>
          </fx-instance>
          <fx-instance id="second">
            <data>
              <option>option1</option>
              <option>option2</option>
              <option>option3</option>
            </data>
          </fx-instance>
        </fx-model>
        <fx-control ref="item">
          <select class="widget" ref="instance('second')/option">
            <template>
              <option value="{.}">{.}</option>
            </template>
          </select>
        </fx-control>
      </fx-fore>
    `);

    // await oneEvent(el, 'refresh-done');

    const select = el.querySelector('.widget');
    expect(select).to.exist;
    expect(select.children).to.exist;
    expect(select.children.length).to.equal(4);
    console.log('children of selects', select.children);
    expect(select.children[0].nodeName).to.equal('TEMPLATE');
    expect(select.children[1].nodeName).to.equal('OPTION');
    expect(select.children[1].textContent).to.equal('option1');
    expect(select.children[2].nodeName).to.equal('OPTION');
    expect(select.children[2].textContent).to.equal('option2');
    expect(select.children[3].nodeName).to.equal('OPTION');
    expect(select.children[3].textContent).to.equal('option3');
  });
  it('is creates a select with 4 options with selection=open', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <item>foobar</item>
            </data>
          </fx-instance>
          <fx-instance id="second">
            <data>
              <option>option1</option>
              <option>option2</option>
              <option>option3</option>
            </data>
          </fx-instance>
        </fx-model>
        <fx-control ref="item">
          <select class="widget" ref="instance('second')/option" selection="open">
            <template>
              <option value="{.}">{.}</option>
            </template>
          </select>
        </fx-control>
      </fx-fore>
    `);

    // await oneEvent(el, 'refresh-done');

    const select = el.querySelector('.widget');
    expect(select).to.exist;
    expect(select.children).to.exist;

    const options = select.querySelectorAll('option');
    expect(options.length).to.equal(4);

    console.log('children of selects', select.children);
    expect(select.children[0].nodeName).to.equal('TEMPLATE');
    expect(select.children[1].nodeName).to.equal('OPTION');
    // first option is empty
    expect(select.children[1].textContent).to.equal('');

    expect(select.children[2].nodeName).to.equal('OPTION');
    expect(select.children[2].textContent).to.equal('option1');
    expect(select.children[3].nodeName).to.equal('OPTION');
    expect(select.children[3].textContent).to.equal('option2');
    expect(select.children[4].nodeName).to.equal('OPTION');
    expect(select.children[4].textContent).to.equal('option3');
  });

});
