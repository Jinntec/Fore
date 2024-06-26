/* eslint-disable no-unused-expressions */
import {
  html, fixture, expect, elementUpdated, oneEvent,
} from '@open-wc/testing';

import '../index.js';

describe('fx-control with select tests', () => {
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
