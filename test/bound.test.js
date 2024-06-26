/* eslint-disable no-unused-expressions */
import {
  html, fixture, expect, elementUpdated, oneEvent, fixtureSync,
} from '@open-wc/testing';

import '../index.js';

describe('fx-control tests', () => {
  it('is creates a native input when no control is provided', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <item>foobar</item>
              <checked>true</checked>
            </data>
            <fx-bind ref="item"></fx-bind>
            <fx-bind ref="checked"></fx-bind>
          </fx-instance>
        </fx-model>
        <fx-group>
          <fx-control id="input1" ref="item">
            <label slot="label">with onblur handler</label>
          </fx-control>
        </fx-group>
      </fx-fore>
    `);

    // await elementUpdated(el);
    const bound = el.querySelector('#input1');
    expect(bound).to.exist;

    const input = bound.widget;
    expect(input).to.exist;

    expect(bound.modelItem.value).to.equal('foobar');
    expect(input.value).to.equal('foobar');

    bound.modelItem.value = 'new';
    // input.blur();
    // await oneEvent(bound, 'value-changed');
    // expect(bound.modelItem.value).to.equal('new');
  });

  it('is initialized', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <item>foobar</item>
              <checked>true</checked>
            </data>
            <fx-bind ref="item"></fx-bind>
            <fx-bind ref="checked"></fx-bind>
          </fx-instance>
        </fx-model>
        <fx-group>
          <fx-control id="input1" ref="item" update-event="blur" value-prop="value">
            <label>with onblur handler</label>
            <input class="widget" name="value" value="" />
          </fx-control>
        </fx-group>
      </fx-fore>
    `);

    // await elementUpdated(el);
    // await oneEvent(el, 'refresh-done');

    const bound = el.querySelector('#input1');
    expect(bound).to.exist;

    const control = document.querySelector('.widget');
    expect(bound.widget).to.equal(control);
  });

  it('creates fx-control', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <item>foobar</item>
              <checked>true</checked>
            </data>
            <fx-bind ref="item"></fx-bind>
            <fx-bind ref="checked"></fx-bind>
          </fx-instance>
        </fx-model>
        <fx-group>
          <fx-control id="input1" ref="item" update-event="blur" value-prop="value">
            <label slot="label">with onblur handler</label>
            <input name="value" value="" />
          </fx-control>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);
    const bound = el.querySelector('#input1');
    expect(bound).to.exist;
  });

  it('it updates when update event fires', async () => {
    const el = await fixture(html`
                <fx-fore>
                    <fx-model id="model1">
                        <fx-instance>
                            <data>
                                <item>foobar</item>
                                <checked>true</checked>
                            </data>
                            <fx-bind ref="item"></fx-bind>
                            <fx-bind ref="checked"></fx-bind>
                        </fx-instance>
                    </fx-model>
                    <fx-group>
                        <fx-control id="input1" ref="item" update-event="blur" value-prop="value">
                            <label slot="label">with onblur handler</label>
                            <input id="input1" name="value" value="">
                        </fx-control>

                    </fx-group>
                    <fx-setvalue event="refresh-done" ref="item"">foo</fx-setvalue>
                </fx-fore>
            `);

    // await elementUpdated(el);

    const bound = el.querySelector('#input1');
    expect(bound).to.exist;

    const i1 = document.getElementById('input1');
    i1.value = 'foo';
    i1.blur();
    expect(i1.value).to.equal('foo');
  });

  it('initialzes native select', async () => {
    const el = await fixture(html`
                <fx-fore>
                    <fx-model>
                        <fx-instance>
                            <data>
                                <listitem>foo</listitem>
                            </data>
                        </fx-instance>
                    </fx-model>
                    <fx-group>
                        <fx-control ref="listitem" update-event="change">
                            <label slot="label">native select</label>
                            <select class="fxWidget">
                                <option value=""></option>
                                <option value="foo">foo</option>
                                <option value="bar">bar</option>
                            <select>
                        </fx-control>
                    </fx-group>
                </fx-fore>
            `);

    // await elementUpdated(el);

    const bound = el.querySelector('fx-control');
    expect(bound).to.exist;
    expect(bound.valueProp).to.equal('value');
    expect(bound[bound.valueProp]).to.equal('foo');

    const select = el.querySelector('select');
    expect(select).to.exist;
    console.log('select value ', select.value);
    // expect(select.value).to.equal('foo');
  });

  it('does not show trigger bound to non-existing node', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <listitem>foo</listitem>
            </data>
          </fx-instance>
        </fx-model>
        <fx-trigger ref="foo">
          <button>foo</button>
        </fx-trigger>
      </fx-fore>
    `);

    // await elementUpdated(el);

    const bound = el.querySelector('fx-trigger');
    expect(bound).to.exist;
    expect(bound.hasAttribute('nonrelevant')).to.be.true;
  });

  it('Correctly checks lone checkboxes', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <item>foobar</item>
              <result></result>
            </data>
            <fx-bind ref="item"></fx-bind>
          </fx-instance>
        </fx-model>
        <fx-group>
          <span id="result">{result}</span>
          <fx-control id="input1" ref="result">
            <fx-items ref="instance('default')/item">
              <template>
                <span id="checkbox">
                  <label slot="label">{.}</label>
                  <input type="checkbox" value="{.}" />
                </span>
              </template>
            </fx-items>
          </fx-control>
        </fx-group>
      </fx-fore>
    `);

    // await elementUpdated(el);
    await oneEvent(el, 'refresh-done');

    const checkbox = el.querySelector('#checkbox input');
    checkbox.click();

    const resultSpan = el.querySelector('#result');
    expect(resultSpan.innerText).to.equal('foobar');
  });

  it('Correctly unchecks lone checkboxes', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <item>foobar</item>
              <result>foobar</result>
            </data>
            <fx-bind ref="item"></fx-bind>
          </fx-instance>
        </fx-model>
        <fx-group>
          <span id="result">{result}</span>
          <fx-control id="input1" ref="result">
            <fx-items ref="instance('default')/item">
              <template>
                <span id="checkbox">
                  <label slot="label">{.}</label>
                  <input type="checkbox" value="{.}" />
                </span>
              </template>
            </fx-items>
          </fx-control>
        </fx-group>
      </fx-fore>
    `);

    // await elementUpdated(el);
    await oneEvent(el, 'refresh-done');

    const checkbox = el.querySelector('#checkbox input');
    checkbox.click();
    const resultSpan = el.querySelector('#result');
    expect(resultSpan.innerText).to.equal('');
  });
});
