/* eslint-disable no-unused-expressions */
import {
  html, oneEvent, fixtureSync, expect,
} from '@open-wc/testing';

import '../index.js';

describe('lazy initialize', () => {
  it('creates model and instance', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-output ref="greeting">Hello Universe</fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    console.log('modelitems ', model.modelItems);
    expect(model.modelItems.length).to.equal(1);

    const mi1 = model.modelItems[0];
    expect(mi1.value).to.equal('Hello Universe');
    expect(mi1.readonly).to.equal(false);
    expect(mi1.required).to.equal(false);
    expect(mi1.relevant).to.equal(true);
    expect(mi1.constraint).to.equal(true);
    expect(mi1.type).to.equal('xs:string');
    expect(mi1.path).to.equal('$default/greeting[1]');
  });

  it('constructs correct elements for nested location path', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-output ref="planet/greeting"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    console.log('modelitems ', model.modelItems);
    expect(model.modelItems.length).to.equal(1);

    const inst = el.querySelector('fx-instance');
    console.log('++++++++++++ inst ', inst);
    // await elementUpdated(inst);
    expect(inst).to.exist;
    expect(inst.instanceData).to.exist;
    const root = inst.instanceData.firstElementChild;
    expect(root.nodeName).to.equal('data');
    const outer = root.firstElementChild;
    expect(outer.nodeName).to.equal('planet');
    const inner = outer.firstElementChild;
    expect(inner.nodeName).to.equal('greeting');
  });

  it('creates modelItem during refresh', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-message event="refresh-done">refresh has been done</fx-message>

        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting type="message:">Hello World!</greeting>
            </data>
          </fx-instance>
        </fx-model>

        <fx-group>
          <h1 class="{class}">
            lazy greeting
          </h1>
          <fx-output id="output" ref="greeting/@type"></fx-output>
          <fx-output id="output" ref="greeting"></fx-output>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    console.log('modelitems ', model.modelItems);
    expect(model.modelItems.length).to.equal(2);

    const mi1 = model.modelItems[0];
    expect(mi1.value).to.equal('message:');
    expect(mi1.readonly).to.equal(false);
    expect(mi1.required).to.equal(false);
    expect(mi1.relevant).to.equal(true);
    expect(mi1.constraint).to.equal(true);
    expect(mi1.type).to.equal('xs:string');
    expect(mi1.path).to.equal('$default/greeting[1]/@type');

    const mi2 = model.modelItems[1];
    expect(mi2.value).to.equal('Hello World!');
    expect(mi2.readonly).to.equal(false);
    expect(mi2.required).to.equal(false);
    expect(mi2.relevant).to.equal(true);
    expect(mi2.constraint).to.equal(true);
    expect(mi2.type).to.equal('xs:string');
    expect(mi2.path).to.equal('$default/greeting[1]');
  });

  it('creates a model when there is none', async () => {
    const el = await fixtureSync(html`
      <fx-fore> </fx-fore>
    `);

	  await oneEvent(el, 'refresh-done');

    const model = el.querySelector('fx-model');
    expect(model).to.exist;
    expect(model.instances).to.exist;
    expect(model.instances.length).to.equal(1);
  });

  it('constructs an instance when there is none', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-group ref="outer">
          <fx-output ref="inner1">inner1</fx-output>
          <fx-output ref="inner2">inner2</fx-output>
        </fx-group>
      </fx-fore>
    `);

	  	  await oneEvent(el, 'refresh-done');

    // await oneEvent(el, 'model-construct-done');
    console.log('form  ', el);

    const model = el.querySelector('fx-model');
    console.log('model created ', model);
    const inst = el.querySelector('fx-instance');
    console.log('++++++++++++ inst ', inst);
    // await elementUpdated(inst);
    expect(inst).to.exist;
    expect(inst.instanceData).to.exist;
    const root = inst.instanceData.firstElementChild;
    expect(root.nodeName).to.equal('data');
    const outer = root.firstElementChild;
    expect(outer.nodeName).to.equal('outer');
    const inner = outer.firstElementChild;
    expect(inner.nodeName).to.equal('inner1');
    const inner2 = inner.nextSibling;
    expect(inner2.nodeName).to.equal('inner2');
  });
});
