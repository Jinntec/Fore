/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixtureSync, expect } from '@open-wc/testing';

import '../index.js';

describe('model tests', () => {
  it('rebuilds and recalcuates correctly intitially', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a>A</a>
              <b>B</b>
              <c>C</c>
            </data>
          </fx-instance>
          <fx-bind
            ref="a"
            readonly="string-length(depends(../b)) gt 1"
            required="depends(../b) = 'B'"
          ></fx-bind>
          <fx-bind ref="b" required="depends(../c) = 'C'"></fx-bind>
          <fx-bind ref="c" relevant="depends(../b) = 'B'"></fx-bind>
        </fx-model>
        <fx-group collapse="true">
          <fx-control ref="a" update-event="input">
            <label slot="label">A</label>
          </fx-control>
          <fx-control ref="b" update-event="input">
            <label slot="label">B</label>
          </fx-control>
          <fx-control ref="c" update-event="input">
            <label slot="label">C</label>
          </fx-control>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    console.log('modelitems ', model.modelItems);
    expect(model.modelItems.length).to.equal(3);
    const mainGraph = model.mainGraph.overallOrder();
    expect(mainGraph.length).to.equal(6);
    expect(mainGraph).to.eql([
      '/b[1]',
      '/a[1]:readonly',
      '/a[1]:required',
      '/c[1]',
      '/b[1]:required',
      '/c[1]:relevant',
    ]);

    const mi1 = model.modelItems[0];
    expect(mi1.value).to.equal('A');
    expect(mi1.readonly).to.equal(false);
    expect(mi1.required).to.equal(true);
    expect(mi1.relevant).to.equal(true);
    expect(mi1.constraint).to.equal(true);
    expect(mi1.type).to.equal('xs:string');
    expect(mi1.path).to.equal('/a[1]');

    const mi2 = model.modelItems[1];
    expect(mi2.value).to.equal('B');
    expect(mi2.readonly).to.equal(false);
    expect(mi2.required).to.equal(true);
    expect(mi2.relevant).to.equal(true);
    expect(mi2.constraint).to.equal(true);
    expect(mi2.type).to.equal('xs:string');
    expect(mi2.path).to.equal('/b[1]');

    const mi3 = model.modelItems[2];
    expect(mi3.value).to.equal('C');
    expect(mi3.readonly).to.equal(false);
    expect(mi3.required).to.equal(false);
    expect(mi3.relevant).to.equal(true);
    expect(mi3.constraint).to.equal(true);
    expect(mi3.type).to.equal('xs:string');
    expect(mi3.path).to.equal('/c[1]');
  });

  it('rebuilds and recalcuates correctly after value change', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a>A</a>
              <b>B</b>
              <c>C</c>
            </data>
          </fx-instance>
          <fx-bind
            ref="a"
            readonly="string-length(depends(../b)) gt 1"
            required="depends(../b) = 'B'"
          ></fx-bind>
          <fx-bind ref="b" required="depends(../c) = 'C'"></fx-bind>
          <fx-bind ref="c" relevant="depends(../b) = 'B'"></fx-bind>
        </fx-model>
        <fx-group collapse="true">
          <fx-control ref="a" update-event="input">
            <label slot="label">A</label>
          </fx-control>
          <fx-control ref="b" update-event="input">
            <label slot="label">B</label>
          </fx-control>
          <fx-control ref="c" update-event="input">
            <label slot="label">C</label>
          </fx-control>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    console.log('modelitems ', model.modelItems);

    const mi = model.modelItems[1]; // <b>B</b>
    expect(mi.path).to.equal('/b[1]');

    mi.value = 'BB'; // making <c>C</c> non-relevant
    model.updateModel();

    const mi1 = model.modelItems[0];
    expect(mi1.value).to.equal('A');
    expect(mi1.readonly).to.equal(true);
    expect(mi1.required).to.equal(false);
    expect(mi1.relevant).to.equal(true);
    expect(mi1.constraint).to.equal(true);
    expect(mi1.type).to.equal('xs:string');
    expect(mi1.path).to.equal('/a[1]');

    const mi2 = model.modelItems[1];
    expect(mi2.value).to.equal('BB');
    expect(mi2.readonly).to.equal(false);
    expect(mi2.required).to.equal(true);
    expect(mi2.relevant).to.equal(true);
    expect(mi2.constraint).to.equal(true);
    expect(mi2.type).to.equal('xs:string');
    expect(mi2.path).to.equal('/b[1]');

    const mi3 = model.modelItems[2];
    expect(mi3.value).to.equal('C');
    expect(mi3.readonly).to.equal(false);
    expect(mi3.required).to.equal(false);
    expect(mi3.relevant).to.equal(false);
    expect(mi3.constraint).to.equal(true);
    expect(mi3.type).to.equal('xs:string');
    expect(mi3.path).to.equal('/c[1]');
  });
});
