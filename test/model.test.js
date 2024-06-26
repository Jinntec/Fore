/* eslint-disable no-unused-expressions */
import {
  html, oneEvent, fixtureSync, expect,
} from '@open-wc/testing';

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
    // const mainGraph = model.mainGraph.overallOrder();
    // expect(mainGraph.length).to.equal(6);
    /*
    expect(mainGraph).to.eql([
      '/b[1]',
      '/a[1]:readonly',
      '/a[1]:required',
      '/c[1]',
      '/b[1]:required',
      '/c[1]:relevant',
    ]);
*/

    const mi1 = model.modelItems[0];
    expect(mi1.value).to.equal('A');
    expect(mi1.readonly).to.equal(false);
    expect(mi1.required).to.equal(true);
    expect(mi1.relevant).to.equal(true);
    expect(mi1.constraint).to.equal(true);
    expect(mi1.type).to.equal('xs:string');
    expect(mi1.path).to.equal('$default/a[1]');

    const mi2 = model.modelItems[1];
    expect(mi2.value).to.equal('B');
    expect(mi2.readonly).to.equal(false);
    expect(mi2.required).to.equal(true);
    expect(mi2.relevant).to.equal(true);
    expect(mi2.constraint).to.equal(true);
    expect(mi2.type).to.equal('xs:string');
    expect(mi2.path).to.equal('$default/b[1]');

    const mi3 = model.modelItems[2];
    expect(mi3.value).to.equal('C');
    expect(mi3.readonly).to.equal(false);
    expect(mi3.required).to.equal(false);
    expect(mi3.relevant).to.equal(true);
    expect(mi3.constraint).to.equal(true);
    expect(mi3.type).to.equal('xs:string');
    expect(mi3.path).to.equal('$default/c[1]');
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
    expect(mi.path).to.equal('$default/b[1]');

    mi.value = 'BB'; // making <c>C</c> non-relevant
    model.updateModel();

    const mi1 = model.modelItems[0];
    expect(mi1.value).to.equal('A');
    expect(mi1.readonly).to.equal(true);
    expect(mi1.required).to.equal(false);
    expect(mi1.relevant).to.equal(true);
    expect(mi1.constraint).to.equal(true);
    expect(mi1.type).to.equal('xs:string');
    expect(mi1.path).to.equal('$default/a[1]');

    const mi2 = model.modelItems[1];
    expect(mi2.value).to.equal('BB');
    expect(mi2.readonly).to.equal(false);
    expect(mi2.required).to.equal(true);
    expect(mi2.relevant).to.equal(true);
    expect(mi2.constraint).to.equal(true);
    expect(mi2.type).to.equal('xs:string');
    expect(mi2.path).to.equal('$default/b[1]');

    const mi3 = model.modelItems[2];
    expect(mi3.value).to.equal('C');
    expect(mi3.readonly).to.equal(false);
    expect(mi3.required).to.equal(false);
    expect(mi3.relevant).to.equal(false);
    expect(mi3.constraint).to.equal(true);
    expect(mi3.type).to.equal('xs:string');
    expect(mi3.path).to.equal('$default/c[1]');
  });

  it('recalcuates the whole graph (maingraph)', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-action event="ready">
          <fx-update></fx-update>
          <fx-refresh></fx-refresh>
        </fx-action>

        <fx-model>
          <fx-instance>
            <data>
              <a>10</a>
              <b>10</b>
              <c>0</c>
              <d>0</d>
              <e>0</e>
              <x>3.5</x>
              <y>0</y>
              <z>0</z>
            </data>
          </fx-instance>
          <fx-bind ref="c" calculate="number(../a) * number(../b)" constraint="number(.) <= 100" readonly="true()"></fx-bind>
          <fx-bind ref="d" calculate="number(../a) + number(../b)" constraint="number(.) <= 20" readonly="true()"></fx-bind>
          <fx-bind ref="e" calculate="number(../a) + 5" constraint="number(.) <= 10" readonly="true()"></fx-bind>
          <fx-bind ref="y" calculate="number(../x) + 5" readonly="true()" constraint="number(.) <= 10"></fx-bind>
        </fx-model>
        <fx-control ref="a" update-event="input">
          <label>a</label>
          <input type="number" />
        </fx-control>
        <fx-control ref="b" update-event="input">
          <label>b</label>
          <input type="number" />
        </fx-control>

        <div>group1</div>
        <fx-control ref="c">
          <label>c = a * b <= 100</label>
        </fx-control>
        <fx-control ref="d">
          <label>d = a + b <= 10</label>
        </fx-control>
        <fx-control ref="e">
          <label>e = a + 5 < 10</label>
        </fx-control>

        <div>group2</div>
        <fx-control ref="x" update-event="input">
          <label>x</label>
          <input type="number" />
        </fx-control>
        <fx-control ref="y">
          <label>y = ../x + 5.0 <= 10.0</label>
        </fx-control>
        <fx-control ref="z">
          <label>z</label>
        </fx-control>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    // console.log('modelitems ', model.modelItems);

    // there are 8 modelItems
    expect(model.modelItems.length).to.equal(8);
    expect(Object.keys(model.mainGraph.nodes).length).to.equal(15);

    // there are 15 nodes in mainGraph
    // const graphCount = model.mainGraph.overallOrder(false);
    // expect(graphCount.length).to.equal(15);
  });

  it('recalcuates only the changed "a" subgraph of modelItems', async () => {
    const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <fx-instance>
                        <data>
                            <a>10</a>
                            <b>10</b>
                            <c>0</c>
                            <d>0</d>
                            <e>0</e>
                            <x>3.5</x>
                            <y>0</y>
                            <z>0</z>
                        </data>
                    </fx-instance>
                    <fx-bind ref="c" calculate="number(../a) * number(../b)" constraint="number(.) <= 100" readonly="true()"></fx-bind>
                    <fx-bind ref="d" calculate="number(../a) + number(../b)"  constraint="number(.) <= 20" readonly="true()"></fx-bind>
                    <fx-bind ref="e" calculate="number(../a) + 5"  constraint="number(.) <= 10" readonly="true()"></fx-bind>
                    <fx-bind ref="y" calculate="number(../x) + 5.0" readonly="true()" constraint=". <= 10"></fx-bind>
                </fx-model>
                <fx-control id="a" ref="a" update-event="input">
                    <label>a</label>
                    <input type="number">
                </fx-control>
                <fx-control ref="b" update-event="input">
                    <label>b</label>
                    <input type="number">
                </fx-control>

                <div>group1</div>
                <fx-control id="c" ref="c">
                    <label>c = a * b <= 100</label>
                </fx-control>
                <fx-control id="d" ref="d">
                    <label>d = a + b <= 10</label>
                </fx-control>
                <fx-control id="e" ref="e">
                    <label>e = a + 5 < 10</label>
                </fx-control>

                <div>group2</div>
                <fx-control ref="x" update-event="input">
                    <label>x</label>
                    <input type="number">
                </fx-control>
                <fx-control ref="y">
                    <label>y = ../x + 5.0 <= 10.0</label>
                </fx-control>
                <fx-control ref="z">
                    <label>z</label>
                </fx-control>
                <fx-setvalue event="refresh-done" ref="a"">11</fx-setvalue>

            </fx-fore>
    `);

    await oneEvent(el, 'ready');
    const model = el.querySelector('fx-model');
    // console.log('modelitems ', model.modelItems);

    // there are 8 modelItems
    expect(model.modelItems.length).to.equal(8);
    expect(Object.keys(model.mainGraph.nodes).length).to.equal(15);

    const changed = model.computes;
    expect(changed).to.equal(6);

    const cControl = el.querySelector('#c');
    expect(cControl.getModelItem().value).to.equal('110');

    const dControl = el.querySelector('#d');
    expect(dControl.getModelItem().value).to.equal('21');

    const eControl = el.querySelector('#e');
    expect(eControl.getModelItem().value).to.equal('16');
  });
  it('recalcuates only the changed "b" subgraph of modelItems', async () => {
    const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                  <fx-instance>
                    <data>
                      <a>10</a>
                      <b>10</b>
                      <c>0</c>
                      <d>0</d>
                      <e>0</e>
                      <x>3.5</x>
                      <y>0</y>
                      <z>0</z>
                    </data>
                  </fx-instance>
                  <fx-bind ref="c" calculate="number(../a) * number(../b)" constraint="number(.) <= 100" readonly="true()"></fx-bind>
                  <fx-bind ref="d" calculate="number(../a) + number(../b)"  constraint="number(.) <= 20" readonly="true()"></fx-bind>
                  <fx-bind ref="e" calculate="number(../a) + 5"  constraint="number(.) <= 10" readonly="true()"></fx-bind>
                  <fx-bind ref="y" calculate="number(../x) + 5.0" readonly="true()" constraint=". <= 10"></fx-bind>
                </fx-model>
                <fx-control id="a" ref="a" update-event="input">
                    <label>a</label>
                    <input type="number">
                </fx-control>
                <fx-control ref="b" update-event="input">
                    <label>b</label>
                    <input type="number">
                </fx-control>

                <div>group1</div>
                <fx-control id="c" ref="c">
                    <label>c = a * b <= 100</label>
                </fx-control>
                <fx-control id="d" ref="d">
                    <label>d = a + b <= 10</label>
                </fx-control>
                <fx-control ref="e">
                    <label>e = a + 5 < 10</label>
                </fx-control>

                <div>group2</div>
                <fx-control ref="x" update-event="input">
                    <label>x</label>
                    <input type="number">
                </fx-control>
                <fx-control ref="y">
                    <label>y = ../x + 5.0 <= 10.0</label>
                </fx-control>
                <fx-control ref="z">
                    <label>z</label>
                </fx-control>
                <fx-setvalue event="refresh-done" ref="b"">11</fx-setvalue>

            </fx-fore>
    `);

    await oneEvent(el, 'ready');
    const model = el.querySelector('fx-model');
    // console.log('modelitems ', model.modelItems);
    expect(Object.keys(model.mainGraph.nodes).length).to.equal(15);

    const changed = model.computes;
    expect(changed).to.equal(4);

    const cControl = el.querySelector('#c');
    expect(cControl.getModelItem().value).to.equal('110');

    const dControl = el.querySelector('#d');
    expect(dControl.getModelItem().value).to.equal('21');
  });

  it('recalcuates only the changed "x" subgraph of modelItems', async () => {
    const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                  <fx-instance>
                    <data>
                      <a>10</a>
                      <b>10</b>
                      <c>0</c>
                      <d>0</d>
                      <e>0</e>
                      <x>3.5</x>
                      <y>0</y>
                      <z>0</z>
                    </data>
                  </fx-instance>
                  <fx-bind ref="c" calculate="number(../a) * number(../b)" constraint="number(.) <= 100" readonly="true()"></fx-bind>
                  <fx-bind ref="d" calculate="number(../a) + number(../b)"  constraint="number(.) <= 20" readonly="true()"></fx-bind>
                  <fx-bind ref="e" calculate="number(../a) + 5"  constraint="number(.) <= 10" readonly="true()"></fx-bind>
                  <fx-bind ref="y" calculate="number(../x) + 5.0" readonly="true()" constraint=". <= 10"></fx-bind>
                </fx-model>
                <fx-control ref="a" update-event="input">
                    <label>a</label>
                    <input type="number">
                </fx-control>
                <fx-control ref="b" update-event="input">
                    <label>b</label>
                    <input type="number">
                </fx-control>

                <div>group1</div>
                <fx-control ref="c">
                    <label>c = a * b <= 100</label>
                </fx-control>
                <fx-control ref="d">
                    <label>d = a + b <= 10</label>
                </fx-control>
                <fx-control ref="e">
                    <label>e = a + 5 < 10</label>
                </fx-control>

                <div>group2</div>
                <fx-control id="x" ref="x" update-event="input">
                    <label>x</label>
                    <input type="number">
                </fx-control>
                <fx-control id="y" ref="y">
                    <label>y = ../x + 5.0 <= 10.0</label>
                </fx-control>
                <fx-control ref="z">
                    <label>z</label>
                </fx-control>
                <fx-setvalue event="refresh-done" ref="x"">6</fx-setvalue>

            </fx-fore>
    `);

    await oneEvent(el, 'ready');
    const model = el.querySelector('fx-model');
    // console.log('modelitems ', model.modelItems);

    const changed = model.computes;
    expect(changed).to.equal(2);

    expect(Object.keys(model.mainGraph.nodes).length).to.equal(15);

    const { subgraph } = model;
    expect(subgraph).to.exist;

    const xControl = el.querySelector('#x');
    expect(xControl.getModelItem().value).to.equal('6');

    const yControl = el.querySelector('#y');
    expect(yControl.getModelItem().value).to.equal('11');
  });

  it('recalcuates node "string"', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <css></css>
              <rotate>0</rotate>
              <transform></transform>
              <string></string>
            </data>
          </fx-instance>
          <fx-bind ref="css"></fx-bind>
          <fx-bind ref="transform" calculate="string-length(../string) * 10"></fx-bind>
        </fx-model>
        <fx-group>
          <h1 style="transform-origin:50% 50%; transform:rotate({rotate}deg)">
            Dynamic CSS
          </h1>
          <p>Change the range control and see what happens.</p>
          <fx-control ref="rotate" update-event="change">
            <input type="range" step="10" min="0" max="360" />
            <fx-setvalue event="value-changed" ref="../css">bar</fx-setvalue>
          </fx-control>
          <p></p>
          transform:<fx-output ref="transform"></fx-output>
          <p></p>
          <fx-control
            id="transform"
            ref="string"
            update-event="input"
            style="transform:translate({../transform}px);"
          >
            <label>lets move - type something</label>
          </fx-control>
          <div class="foo {css}">
            This div gets a class added when the range control is changed.
          </div>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    const model = el.querySelector('fx-model');
    expect(model.mainGraph.nodes).to.exist;
    expect(Object.keys(model.mainGraph.nodes)).to.exist;
    expect(Object.keys(model.mainGraph.nodes).length).to.equal(4);

    const control = el.querySelector('#transform');
    expect(control).to.exist;
    expect(control.getAttribute('style')).to.equal('transform:translate(0px);');
    control.setValue(10);
    // control.blur();
    expect(control.modelItem.value).to.equal('10');

    expect(control.getAttribute('style')).to.equal('transform:translate(20px);');
  });
});
