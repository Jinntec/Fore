/* eslint-disable no-unused-expressions */
import { html, fixture, expect, elementUpdated } from '@open-wc/testing';

import '../src/fx-form.js';
import '../src/fx-model.js';
import '../src/fx-instance.js';
import '../src/fx-bind.js';
import '../src/ui/fx-output.js';
import '../src/ui/fx-control.js';

describe('fx-control tests', () => {
  it('is initialized', async () => {
    const el = await fixture(html`
      <fx-form>
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
            <input id="control" name="value" value="" />
          </fx-control>
        </fx-group>
      </fx-form>
    `);

    await elementUpdated(el);
    const bound = el.querySelector('#input1');
    expect(bound).to.exist;

    const control = document.getElementById('control');
    expect(bound.control).to.equal(control);
  });

  it('is creates a default input', async () => {
    const el = await fixture(html`
      <fx-form>
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
      </fx-form>
    `);

    await elementUpdated(el);
    const bound = el.querySelector('#input1');
    expect(bound).to.exist;

    const input = bound.control;
    expect(input).to.exist;
  });

  it('is initialized', async () => {
    const el = await fixture(html`
      <fx-form>
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
      </fx-form>
    `);

    await elementUpdated(el);
    const bound = el.querySelector('#input1');
    expect(bound).to.exist;
  });

  it('it updates when update event fires', async () => {
    const el = await fixture(html`
                <fx-form>
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
                </fx-form>
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
                <fx-form>
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
                            <select>
                                <option value=""></option>
                                <option value="foo">foo</option>
                                <option value="bar">bar</option>
                            <select>
                        </fx-control>
                    </fx-group>
                </fx-form>
            `);

    // await elementUpdated(el);

    const bound = el.querySelector('fx-control');
    expect(bound).to.exist;
    expect(bound.valueProp).to.equal('value');
    expect(bound[bound.valueProp]).to.equal('foo');

    const select = el.querySelector('select');
    expect(select).to.exist;
    console.log('select value ', select.value);
    expect(select.value).to.equal('foo');
  });

  /*
    it('is initialized', async () => {
        const el =  (
            await fixture(html`
                <fx-form>
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
                            <input name="value" value="">
                        </fx-control>

                        <fx-control id="input2" ref="item" update-event="input">
                            <label slot="label">with incremental handler</label>
                            <input name="value" value="">
                        </fx-control>

                        <fx-control id="input3" ref="checked" update-event="input" value-prop="checked">
                            <label slot="label">with incremental handler</label>
                            <input name="value" type="checkbox">
                        </fx-control>
                    </fx-group>
                </fx-form>
            `)
        );

        await elementUpdated(el);

        expect(bind).to.exist;

    });
*/
});
