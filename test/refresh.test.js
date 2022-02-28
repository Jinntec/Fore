import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../src/fx-instance.js';
import '../src/ui/fx-container.js';
import '../src/fx-bind.js';

describe('refresh Tests', () => {
  it('refresh renders correct state initially', async () => {
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
                    <fx-bind ref="a" readonly="string-length(../b) > 1"
                             required="../b = 'B'"></fx-bind>
                    <fx-bind ref="b" required="../c = 'C'"></fx-bind>
                    <fx-bind ref="c" relevant="../b = 'B'"></fx-bind>
                </fx-model>
                <fx-group collapse="true">
                    <h1>
                        Recalculation
                    </h1>
                    <div class="display">
                        <fx-output id="output1" ref="a">
                            <label slot="label">a:</label>
                        </fx-output>
                        <fx-output id="output2" ref="b">
                            <fx-label slot="label">b:</fx-label>
                        </fx-output>
                        <fx-output id="output3" ref="c">
                            <fx-label slot="label">c:</fx-label>
                        </fx-output>
                    </div>

                    <fx-control ref="a" update-event="input">
                        <label>A</label>
                    </fx-control>
                    <fx-control ref="b" update-event="input">
                        <label>B</label>
                    </fx-control>
                    <fx-control ref="c" update-event="input">
                        <label>C</label>
                    </fx-control>


                </fx-group>
            </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    expect(el.getModel().modelItems.length).to.equal(3);
    const c1 = el.querySelector('#output1');
    expect(c1).to.exist;
    expect(c1.modelItem).to.exist;
    expect(c1.modelItem.value).to.equal('A');
    expect(c1.modelItem.boundControls).to.exist;
    expect(c1.modelItem.boundControls.length).to.equal(2);


    const c2 = el.querySelector('#output2');
    expect(c2.modelItem.value).to.equal('B');
    expect(c2.modelItem.boundControls).to.exist;
    expect(c2.modelItem.boundControls.length).to.equal(2);

    const c3 = el.querySelector('#output3');
    expect(c3.modelItem.value).to.equal('C');
    expect(c3.modelItem.boundControls).to.exist;
    expect(c3.modelItem.boundControls.length).to.equal(2);


  });

  it('refresh renders correct state after update of control', async () => {
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
                    <fx-bind ref="a" readonly="string-length(../b) > 1"
                             required="../b = 'B'"></fx-bind>
                    <fx-bind ref="b" required="../c = 'C'"></fx-bind>
                    <fx-bind ref="c" relevant="../b = 'B'"></fx-bind>
                </fx-model>
                <fx-group collapse="true">
                    <h1>
                        Recalculation
                    </h1>
                    <div class="display">
                        <fx-output id="output1" ref="a">
                            <label slot="label">a:</label>
                        </fx-output>
                        <fx-output id="output2" ref="b">
                            <fx-label slot="label">b:</fx-label>
                        </fx-output>
                        <fx-output id="output3" ref="c">
                            <fx-label slot="label">c:</fx-label>
                        </fx-output>
                    </div>

                    <fx-control ref="a" update-event="input">
                        <label>A</label>
                    </fx-control>
                    <fx-control id="b" ref="b" update-event="input">
                        <label>B</label>
                    </fx-control>
                    <fx-control ref="c" update-event="input">
                        <label>C</label>
                    </fx-control>


                </fx-group>
            </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');


/*
    const c2 = el.querySelector('#output2');
    expect(c2.modelItem.value).to.equal('B');
*/

    const b = el.querySelector('#b');
    b.modelItem.value = 'Bs';
    el.getModel().updateModel();
    el.refresh();

    const c1 = el.querySelector('#output1');
    expect(c1.modelItem.value).to.equal('A');
    expect(c1.modelItem.boundControls).to.exist;
    expect(c1.modelItem.boundControls.length).to.equal(2);

    // check states
    expect(c1.modelItem.readonly).to.be.true;
    expect(c1.modelItem.required).to.be.false;
    //check control states
    expect(c1.classList.contains('readonly')).to.be.true;

    const c2 = el.querySelector('#output2');
    expect(c2.modelItem.value).to.equal('Bs');
    expect(c2.modelItem.boundControls).to.exist;
    expect(c2.modelItem.boundControls.length).to.equal(2);

    expect(c2.modelItem.required).to.be.true;
    expect(c2.classList.contains('required')).to.be.true;


    const c3 = el.querySelector('#output3');
    expect(c3.modelItem.value).to.equal('C');
    expect(c3.modelItem.boundControls).to.exist;
    expect(c3.modelItem.boundControls.length).to.equal(2);

    expect(c3.modelItem.relevant).to.be.false;

  });

});
