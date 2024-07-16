/* eslint-disable no-unused-expressions */
import {
  html, fixture, fixtureSync, expect, elementUpdated, oneEvent,
} from '@open-wc/testing';

import '../index.js';

describe('bind Tests', () => {
  it('is initialized', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting>Hello World!</greeting>
            </data>
          </fx-instance>
          <fx-bind id="b-greeting" ref="greeting" required="1 = 1"></fx-bind>
        </fx-model>
      </fx-fore>
    `);

    //      await elementUpdated(el);
	  await oneEvent(el, 'ready');
    const bind = document.getElementById('b-greeting');
    expect(bind).to.exist;
    expect(bind.instanceId).to.equal('default');

    const model = document.getElementById('model1');
    expect(model.modelItems.length).to.equal(1);

    const mi = model.modelItems[0];
    expect(mi.node instanceof Node).to.equal(true);

    console.log('*****', mi);
    // expect(mi.modelItem.value).to.exist;
    expect(mi.node.textContent).to.equal('Hello World!');
    expect(mi.node).to.equal(mi.node);

    expect(mi.readonly).to.exist;
    expect(mi.required).to.exist;
    expect(mi.required).to.equal(true);

    expect(mi.relevant).to.exist;
    expect(mi.constraint).to.exist;
    // expect(mi.modelItem.type).to.exist;
  });

  /*
    it('works with nested attribute', async () => {
        const el =  (
            await fixtureSync(html`
                <fx-fore>
                    <fx-model id="model1">
                        <fx-instance>
                            <data>
                                <greeting type="message">Hello World!</greeting>
                            </data>
                        </fx-instance>
                        <fx-bind id="b-greeting" ref="greeting" required="1 = 1">
                            <fx-bind id="b-type" ref="@type"></fx-bind>
                        </fx-bind>
                    </fx-model>
                </fx-fore>
            `)
        );

        await elementUpdated(el);
        const bind1 = document.getElementById('b-greeting');
        expect(bind1).to.exist;
        expect(bind1.instanceId).to.equal('default');
        const bind2 = document.getElementById('b-type');
        expect(bind2.instanceId).to.equal('default');
        expect(bind2).to.exist;

        const model = document.getElementById('model1');
        expect(model.modelItems.length).to.equal(2);

        const mi = model.modelItems[1];
        expect(mi.node).to.exist;
        expect(mi.node.textContent).to.equal('message');
    });
*/

  it('works with nested element', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting>
                <message>Hello World!</message>
              </greeting>
            </data>
          </fx-instance>
          <fx-bind id="b-greeting" ref="greeting">
            <fx-bind id="b-message" ref="message"></fx-bind>
          </fx-bind>
        </fx-model>
      </fx-fore>
    `);

    await elementUpdated(el);
    const bind1 = document.getElementById('b-greeting');
    expect(bind1).to.exist;
    const bind2 = document.getElementById('b-message');
    expect(bind2).to.exist;

    const model = document.getElementById('model1');
    expect(model.modelItems.length).to.equal(2);

    const mi = model.modelItems[1];
    expect(mi.node).to.exist;
    expect(mi.node.textContent).to.equal('Hello World!');
  });

  it('works with nested dot reference', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting>Hello World!</greeting>
            </data>
          </fx-instance>
          <fx-bind id="greeting" ref="greeting">
            <fx-bind ref="."></fx-bind>
          </fx-bind>
        </fx-model>
      </fx-fore>
    `);

    await elementUpdated(el);
    const bind1 = document.getElementById('greeting');
    expect(bind1).to.exist;

    const model = document.getElementById('model1');
    expect(model.modelItems.length).to.equal(1);
  });

  it('works for repeated element', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
            </data>
          </fx-instance>

          <fx-bind id="task" ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
            <fx-bind ref="@complete" type="xs:boolean"></fx-bind>
            <fx-bind ref="@due" type="xs:date"></fx-bind>
          </fx-bind>
        </fx-model>
      </fx-fore>
    `);

    await elementUpdated(el);
    const bind1 = document.getElementById('task');
    expect(bind1).to.exist;
    expect(bind1.nodeset.length).to.equal(2);
    expect(bind1.nodeset[0].nodeName).to.equal('task');
    expect(bind1.nodeset[0].nodeType).to.equal(1);
    expect(bind1.nodeset[0].textContent).to.equal('Pick up Milk');
    expect(bind1.nodeset[1].nodeName).to.equal('task');
    expect(bind1.nodeset[1].nodeType).to.equal(1);
    expect(bind1.nodeset[1].textContent).to.equal('Make tutorial part 1');

    const model = document.getElementById('record');
    expect(model.modelItems.length).to.equal(6);

    console.log('model', model.modelItems);
    expect(model.modelItems[0].node.nodeType).to.equal(1);
    expect(model.modelItems[0].node.textContent).to.equal('Pick up Milk');

    expect(model.modelItems[1].node.nodeType).to.equal(1);
    expect(model.modelItems[1].node.textContent).to.equal('Make tutorial part 1');

    expect(model.modelItems[2].node.nodeType).to.equal(2);
    expect(model.modelItems[2].value).to.equal('false');

    expect(model.modelItems[3].node.nodeType).to.equal(2);
    expect(model.modelItems[3].value).to.equal('true');

    expect(model.modelItems[4].node.nodeType).to.equal(2);
    expect(model.modelItems[4].node.textContent).to.equal('2019-02-04');

    expect(model.modelItems[5].node.nodeType).to.equal(2);
    expect(model.modelItems[5].node.textContent).to.equal('2019-01-04');
  });

  it('combines facets for dot reference', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting>Hello World!</greeting>
            </data>
          </fx-instance>
          <fx-bind id="greeting" ref="greeting">
            <fx-bind ref="." required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
      </fx-fore>
    `);

    await elementUpdated(el);
    const bind1 = document.getElementById('greeting');
    expect(bind1).to.exist;

    const model = document.getElementById('model1');
    expect(model.modelItems.length).to.equal(1);
    expect(model.modelItems[0].required).to.equal(true);
  });

  it('uses closest binding expr', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting>Hello World!</greeting>
            </data>
          </fx-instance>
          <fx-bind id="greeting" ref="greeting">
            <fx-bind required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
      </fx-fore>
    `);

    await elementUpdated(el);
    const bind1 = document.getElementById('greeting');
    expect(bind1).to.exist;

    const model = document.getElementById('model1');
    expect(model.modelItems.length).to.equal(1);
    console.log('++++++++++++++++++++++++++++ ', model.modelItems);
    expect(model.modelItems[0].required).to.equal(true);
  });

  /*
    it('hides non-relevant (unbound) controls', async () => {
        const el =  (
            await fixtureSync(html`
                <fx-fore>
                    <fx-model id="model1">
                        <fx-instance>
                            <data>
                                <greeting>Hello World!</greeting>
                            </data>
                        </fx-instance>
                    </fx-model>
                    <fx-output id="output" ref="greet"></fx-output>

                </fx-fore>
            `)
        );

        await elementUpdated(el);

        const model = document.getElementById('model1');
        expect(model.modelItems.length).to.equal(0);

        const out = document.getElementById('output');
        await elementUpdated(out);

        // console.log('++++++++++++++++++++++++++++output ', out);
        expect('#output');
        expect('#output').dom.to.have.text('');
        // expect('#output').dom.not.to.be.displayed()

        // expect(out).is(":visible"), true)
        console.log('++++++++++++++++++++++++++++ ', model.modexlItems);

    });
*/

  it('nested binding are working', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting type="message">Hello World!</greeting>
            </data>
          </fx-instance>
          <fx-bind id="b-greeting" ref="greeting" required="1 = 1">
            <fx-bind id="b-type" ref="@type"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-group>
          <fx-output id="output1" ref="greeting"> </fx-output> :
          <fx-output id="output2" ref="greeting/@type"></fx-output>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);
    const bind = document.getElementById('b-greeting');
    expect(bind).to.exist;

    const model = document.getElementById('model1');
    expect(model.modelItems.length).to.equal(2);

    // check the modelitems
    const mi = model.modelItems[0];
    expect(mi.node).to.exist;
    expect(mi.node.textContent).to.equal('Hello World!');

    const mi2 = model.modelItems[1];
    expect(mi2.node).to.exist;
    expect(mi2.node.nodeType).to.equal(2); // attribute
    expect(mi2.node.nodeName).to.equal('type'); // attribute
    expect(mi2.node.textContent).to.equal('message');

    // check the controls
    const out1 = document.getElementById('output1');
    expect(out1.nodeName).to.equal('FX-OUTPUT');
    expect(out1.modelItem).to.exist;
    console.log('modelItem ', out1.getModelItem());

    expect(out1.getModelItem()).to.equal(mi);
    expect(out1.getModelItem().node.nodeType).to.equal(1);
    expect(out1.ref).to.equal('greeting');
    expect(out1.getModelItem().value).to.equal('Hello World!');

    expect(out1.value).to.equal('Hello World!');

    const out2 = document.getElementById('output2');
    expect(out2.nodeName).to.equal('FX-OUTPUT');
    expect(out2.nodeset).to.exist;
    console.log('++++++++++++ nodeset ', out2.nodeset);
    console.log('++++++++++++ nodeset ', out2.nodeset.parentNode);
    expect(out2.ref).to.equal('greeting/@type');
    expect(out2.value).to.equal('message');
  });

  it('can resolve calculates in bind in the correct order: nodes', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <m1>3</m1>
              <m2>0</m2>
              <add>0</add>
              <result></result>
            </data>
          </fx-instance>
          <fx-bind ref="add" calculate="../m2 + 5"></fx-bind>
          <fx-bind ref="m2" calculate="../m1 * 2"></fx-bind>
        </fx-model>
        <fx-group>
          <fx-output id="output" ref="add"></fx-output>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);

    const output = el.querySelector('#output');
    expect(output.value).to.equal('11');
  });

  it('uses the correct context for the context function', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <a><b>b in a</b></a>
              <b>b in root</b>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <fx-output id="output" ref="a" value="b"></fx-output>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);

    const output = el.querySelector('#output');
    expect(output.value).to.equal('b in a');
  });

  it('can resolve calculates in bind in the correct order: attributes', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <m1 val="3"></m1>
              <m2 val="0"></m2>
              <add val="0"></add>
              <result></result>
            </data>
          </fx-instance>
          <fx-bind ref="add" calculate="../m2/@val + 5"></fx-bind>
          <fx-bind ref="m2/@val" calculate="../../m1/@val * 2"></fx-bind>
        </fx-model>
        <fx-group>
          <fx-output id="output" ref="add"></fx-output>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);

    const output = el.querySelector('#output');
    expect(output.value).to.equal('11');
  });

  it('does not explode on recursive dependencies', async () => {
    const el = await fixture(html`
            <fx-fore>

                <fx-model id="model1">
                        <data>
                            <m1>3</m1>
                            <m2>0</m2>
                        </data>
                    </fx-instance>
                    <fx-bind ref="m1" calculate="../m2 + 5"></fx-bind>
                    <fx-bind ref="m2" calculate="../m1 * 2"></fx-bind>
                </fx-model>
                <fx-group>
                  <fx-output id="output" ref="add"></fx-output>
                </fx-group>
            </fx-fore>

    `);

    await elementUpdated(el);

    const output = el.querySelector('#output');
    expect(output.value).to.equal('');
  });

  it('fails using camelcase node names', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <theanswer></theanswer>
            </data>
          </fx-instance>
        </fx-model>
        <fx-output ref="theanswer"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    console.log('modelitems ', model.modelItems);
    expect(model.modelItems.length).to.equal(1);
  });

  it('works with camelcase node names from external xml file', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance src="base/test/answer.xml"></fx-instance>
        </fx-model>
        <fx-output ref="theAnswer"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    console.log('modelitems ', model.modelItems);
    expect(model.modelItems.length).to.equal(1);
  });

  it('uses the instance of parent bind', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <item>foobar</item>
              <result>foobar</result>
            </data>
          </fx-instance>
          <fx-instance id="second">
            <data>
              <items>
                <item>Part1</item>
                <item>Part2</item>
              </items>
            </data>
          </fx-instance>

          <fx-bind ref="instance('second')">
            <fx-bind id="wrap" ref=".//item">
              <fx-bind id="nested" ref="part" constraint="false()"></fx-bind>
            </fx-bind>
          </fx-bind>

        </fx-model>
        <fx-repeat ref="instance('second')//item">
          <template>
            <fx-control ref=".">
              <label>Part:</label>
            </fx-control>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const nestedBind = el.querySelector('#nested');
    expect(nestedBind.instanceId).to.equal('second');
  });
});
