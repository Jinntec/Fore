/* eslint-disable no-unused-expressions */
import {
  html, fixtureSync, expect, elementUpdated, oneEvent,
} from '@open-wc/testing';

import '../index.js';
import * as fx from 'fontoxpath';

describe('control tests', () => {
  it('shows control alert defined on control', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a>Aa</a>
              <b>B</b>
              <c>C</c>
            </data>
          </fx-instance>

          <fx-bind ref="a" constraint="string-length(.) = 1"></fx-bind>
          <fx-bind
            ref="b"
            constraint="string-length(.) = 1"
            alert="string must be exactly one character long"
          ></fx-bind>
          <fx-bind ref="c" constraint="string-length(.) = 1">
            <fx-alert><b>string must be exactly 1 character long</b></fx-alert>
          </fx-bind>
        </fx-model>

        <fx-control id="input1" label="A-label" ref="a">
          <fx-alert id="alert1">Constraint not valid</fx-alert>
          <fx-hint>must be one character long</fx-hint>
        </fx-control>

        <fx-control id="input2" label="B-label" ref="b">
          <fx-alert id="alert2">Constraint not valid</fx-alert>
          <fx-hint>must be one character long</fx-hint>
        </fx-control>
      </fx-fore>
    `);

    // await elementUpdated(el);

    await oneEvent(el, 'refresh-done');

    /*
        WOW - crazy - using an id of 'input' somehow makes SVG from the controls - weird
         */
    // const input1 = document.getElementById('input1');
    // expect(input1.hasAttribute('invalid')).to.be.true;

    const alert1 = document.getElementById('alert1');
    expect(alert1).to.exist;
    expect(alert1.firstElementChild).to.be.null; // should not contain further elements

    const input2 = document.getElementById('input2');
    const alert2 = input2.firstElementChild;
    console.log('alert 2 ', alert2);
    expect(alert2).to.exist;

    // expect(window.getComputedStyle(alert2, null).display).to.equal('none');
  });

  it('keeps on displaying alert as long as modelItem is invalid', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a>Aa</a>
            </data>
          </fx-instance>
          <fx-bind ref="a" constraint="string-length(.) = 1"></fx-bind>
        </fx-model>

        <fx-control id="input1" label="A-label" ref="a">
          <fx-alert id="alert1">Constraint not valid</fx-alert>
        </fx-control>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = document.getElementById('model1');
    console.log('items ', model.modelItems);

    const alert1 = document.getElementById('alert1');
    console.log('alert1 ', alert1);
    expect(alert1).to.exist;
    expect(alert1).to.be.visible;

    // const input = document.getElementById('input1');
    const input = el.querySelector('#input1');
    const widget = input.getWidget();
    expect(widget).to.exist;
    expect(widget.value).to.equal('Aa');
    expect(input.getWidget().value).to.equal('Aa');

    // widget.value = 'Aaa';
    // widget.blur();
    model.modelItems[0].value = 'Aaa';
    model.updateModel();

    console.log('items ', model.modelItems);
    expect(model.modelItems[0].value).to.equal('Aaa');
    expect(alert1).to.exist;
    expect(alert1).to.be.visible;
  });

  it('does not display alert initially', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a>Aa</a>
            </data>
          </fx-instance>
          <fx-bind ref="a" constraint="string-length(.) = 1"></fx-bind>
        </fx-model>

        <fx-control id="input1" label="A-label" ref="a">
          <fx-alert id="alert1">Constraint not valid</fx-alert>
        </fx-control>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = document.getElementById('model1');

    const alert1 = document.getElementById('alert1');
    console.log('alert1 ', alert1);
    expect(alert1).to.exist;
    // expect(alert1).not.to.be.visible;

    // const input = document.getElementById('input1');
    const input = el.querySelector('#input1');
    // expect(input.hasAttribute('invalid')).to.be.true;
    const widget = input.getWidget();
    expect(widget).to.exist;
    expect(widget.value).to.equal('Aa');
    expect(input.getWidget().value).to.equal('Aa');

    expect(alert1).to.exist;
    // expect(window.getComputedStyle(alert1, null).display).to.equal('none');
  });

  it('creates modelitem alerts', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <b>Aa</b>
            </data>
          </fx-instance>
          <fx-bind ref="b" constraint="string-length(.) = 1"
                   alert="string must be exactly one character long"></fx-bind>
        </fx-model>

        <fx-control id="ctrl" label="B-label" ref="b">
        </fx-control>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = document.getElementById('model1');

    const ctrl = el.querySelector('#ctrl');
    expect(ctrl.getModelItem()).to.exist;
    expect(ctrl.getModelItem().alerts).to.exist;
    expect(ctrl.getModelItem().alerts.length).to.equal(1);
    expect(ctrl.getModelItem().alerts[0]).to.equal('string must be exactly one character long');
  });

  it('has a control child with value "A"', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a>A</a>
            </data>
          </fx-instance>
          <fx-bind ref="a" constraint="string-length(.) = 1"></fx-bind>
        </fx-model>

        <fx-control id="input1" label="A-label" ref="a"> </fx-control>
      </fx-fore>
    `);

    await elementUpdated(el);
    // let { detail } = await oneEvent(el, 'refresh-done');
    const input = document.getElementById('input1');
    expect(input.widget).to.exist;
    console.log('control value ', input.widget);
    expect(input.widget.value).to.equal('A');
  });

  it('gets readonly state attribute', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a>A</a>
            </data>
          </fx-instance>
          <fx-bind ref="a" readonly="true()"></fx-bind>
        </fx-model>

        <fx-control id="input1" label="A-label" ref="a"> </fx-control>
      </fx-fore>
    `);

    await elementUpdated(el);
    // let { detail } = await oneEvent(el, 'refresh-done');
    const input = document.getElementById('input1');
    const mi = input.getModelItem();
    expect(mi.readonly).to.be.true;
    expect(input.widget).to.exist;
    expect(input.hasAttribute('readonly')).to.be.true;
  });

  it('gets readonly state attribute', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a>A</a>
            </data>
          </fx-instance>
          <fx-bind ref="a" readonly="true()"></fx-bind>
        </fx-model>

        <fx-control id="input1" label="A-label" ref="a"> </fx-control>
      </fx-fore>
    `);

    await elementUpdated(el);
    // let { detail } = await oneEvent(el, 'refresh-done');
    const input = document.getElementById('input1');
    const mi = input.getModelItem();
    expect(mi.readonly).to.be.true;
    expect(input.widget).to.exist;
    expect(input.hasAttribute('readonly')).to.be.true;
  });

  it('gets required state attribute', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a>A</a>
            </data>
          </fx-instance>
          <fx-bind ref="a" required="true()"></fx-bind>
        </fx-model>

        <fx-control id="input1" label="A-label" ref="a"> </fx-control>
      </fx-fore>
    `);

    await elementUpdated(el);
    // let { detail } = await oneEvent(el, 'refresh-done');
    const input = document.getElementById('input1');
    const mi = input.getModelItem();
    expect(mi.required).to.be.true;
    expect(input.widget).to.exist;
    expect(input.hasAttribute('required')).to.be.true;
  });

  /*
  it.only('changes readonly state to optional', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a>A</a>
              <required>true</required>
            </data>
          </fx-instance>
          <fx-bind ref="a" required="true()"></fx-bind>
        </fx-model>

        <fx-control id="input1" label="A-label" ref="a"> </fx-control>
        <fx-trigger>
          <fx-setvalue id="set" ref="required">false</fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    // await elementUpdated(el);
    await oneEvent(el, 'refresh-done');

    // let { detail } = await oneEvent(el, 'refresh-done');
    const input = el.querySelector('#input1');
    const mi = input.getModelItem();
    expect(mi.required).to.be.true;
    expect(input.widget).to.exist;
    expect(input.hasAttribute('required')).to.be.true;

    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();
    expect(input.hasAttribute('required')).to.be.false;

  });
*/

  it('gets invalid state attribute', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a>A</a>
            </data>
          </fx-instance>
          <fx-bind ref="a" constraint="false()"></fx-bind>
        </fx-model>

        <fx-control id="input1" label="A-label" ref="a"> </fx-control>
      </fx-fore>
    `);

    // await elementUpdated(el);
    const { detail } = await oneEvent(el, 'refresh-done');
    const input = document.getElementById('input1');
    const mi = input.getModelItem();
    expect(mi.constraint).to.be.false;
    expect(input.widget).to.exist;
    expect(input.hasAttribute('invalid')).to.be.false;

    // modifying value
    input.setValue('foo'); // modified to trigger first refresh that shows validity state
    await oneEvent(input, 'invalid');
    expect(input.hasAttribute('invalid')).to.be.true;
  });

  it('updates isEmpty class', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a></a>
            </data>
          </fx-instance>
          <fx-bind ref="a" required="true()"></fx-bind>
        </fx-model>

        <fx-control id="input1" label="A-label" ref="a"> </fx-control>
      </fx-fore>
    `);

    // await elementUpdated(el);
    const { detail } = await oneEvent(el, 'refresh-done');
    const input = document.getElementById('input1');
    const mi = input.getModelItem();
    expect(mi.required).to.be.true;
    expect(input.widget).to.exist;
    expect(input.hasAttribute('invalid')).to.be.true;
    expect(input.classList.contains('isEmpty')).to.be.true;

    // modifying value
    input.setValue('foo'); // modified to trigger first refresh that shows validity state
    await oneEvent(input, 'value-changed');

    expect(input.classList.contains('isEmpty')).to.be.false;
  });

  // untestable - correct results interactively but not in this test
  it.skip('updates visited class', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a></a>
            </data>
          </fx-instance>
          <fx-bind ref="a" required="true()"></fx-bind>
        </fx-model>

        <fx-control id="input1" label="A-label" ref="a"></fx-control>
      </fx-fore>
    `);

    // await elementUpdated(el);
    const { detail } = await oneEvent(el, 'refresh-done');
    const input = document.getElementById('input1');
    const mi = input.getModelItem();
    expect(input.classList.contains('visited')).to.be.false;

    // modifying value
    input.setValue('foo'); // modified to trigger first refresh that shows validity state
    // await oneEvent(input, 'value-changed');
    // input.focus();
    input.blur();
    console.log('claslist', input.classList);
    expect(input.classList.contains('visited')).to.be.true;
  });

  it('creates non existing attributes', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <item attr1="foo"></item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-control ref="item/@attr2" create></fx-control>
        <fx-group ref="item" create>
          <fx-control ref="@attr3"></fx-control>
        </fx-group>
        <fx-inspector></fx-inspector>
      </fx-fore>
    `);

    // await elementUpdated(el);
    const { detail } = await oneEvent(el, 'refresh-done');

    const instance = el.querySelector('fx-instance');
    const item = fx.evaluateXPathToFirstNode('//item', instance.instanceData, null, {});

    expect(item).to.exist;
    expect(item.hasAttribute('attr2')).to.be.true;
    expect(item.hasAttribute('attr3')).to.be.true;
  });

  /*
    it('listens for event', async () => {
        const el =  (
            await fixtureSync(html`
                <fx-fore>
                    <fx-model id="model1">
                        <fx-instance>
                            <data>
                                <a>A</a>
                            </data>
                        </fx-instance>

                    </fx-model>

                    <fx-input id="input1" label="A-label" ref="a">
                    </fx-input>

                </fx-fore>`)
        );

        await elementUpdated(el);
        // let { detail } = await oneEvent(el, 'refresh-done');

        const input = document.getElementById('input1');
        input.value='baz';
        // let { detail } = await oneEvent(input, 'value-changed');
        input.setValue('baz');
        // const ctrl = input.shadowRoot.querySelector('#input');

        // input.control.value = 'baz';
        // console.log('input control', input.control);
        // input.control.blur();

        // const model = el.querySelector('fx-model');
        // model.updateModel();
        // el.refresh();

        await oneEvent(el, 'refresh-done');

        console.log('modelitem ', input.modelItem);
        // let { detail1 } = await oneEvent(input, 'value-changed');

        expect(input.modelItem.value).to.be.equal('baz');

    });
*/
});
