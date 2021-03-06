/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE } from '@open-wc/testing';

import '../src/xf-instance.js';
import '../src/ui/xf-container.js';
import '../src/xf-bind.js';
import { ModelItem } from '../src/ModelItem.js';

describe('bind Tests', () => {

    it('is initialized', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting>Hello World!</greeting>
                            </data>
                        </xf-instance>
                        <xf-bind id="b-greeting" ref="greeting" required="1 = 1"></xf-bind>
                    </xf-model>
                </xf-form>               
            `)
        );

        await elementUpdated(el);
        const bind = document.getElementById('b-greeting');
        expect(bind).to.exist;
        expect(bind.instanceId).to.equal('default');

        const model = document.getElementById('model1');
        expect(model.modelItems.length).to.equal(1);

        const mi = model.modelItems[0];
        expect((mi.node instanceof Node)).to.equal(true);

        console.log('*****',mi);
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
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting type="message">Hello World!</greeting>
                            </data>
                        </xf-instance>
                        <xf-bind id="b-greeting" ref="greeting" required="1 = 1">
                            <xf-bind id="b-type" ref="@type"></xf-bind>
                        </xf-bind>
                    </xf-model>
                </xf-form>               
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
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting>
                                    <message>Hello World!</message>
                                </greeting>
                            </data>
                        </xf-instance>
                        <xf-bind id="b-greeting" ref="greeting">
                            <xf-bind id="b-message" ref="message"></xf-bind>
                        </xf-bind>
                    </xf-model>
                </xf-form>               
            `)
        );

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
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting>Hello World!</greeting>
                            </data>
                        </xf-instance>
                        <xf-bind id="greeting" ref="greeting">
                            <xf-bind ref="."></xf-bind>
                        </xf-bind>
                    </xf-model>
                </xf-form>               
            `)
        );

        await elementUpdated(el);
        const bind1 = document.getElementById('greeting');
        expect(bind1).to.exist;

        const model = document.getElementById('model1');
        expect(model.modelItems.length).to.equal(1);

    });

    it('works for repeated element', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="record">
            
                        <xf-instance>
                            <data>
                                <task complete="false" due="2019-02-04">Pick up Milk</task>
                                <task complete="true" due="2019-01-04">Make tutorial part 1</task>
                            </data>
                        </xf-instance>
            
            
                        <xf-bind id="task" ref="task">
                            <xf-bind ref="./text()" required="true()"></xf-bind>
                            <xf-bind ref="@complete" type="xs:boolean"></xf-bind>
                            <xf-bind ref="@due" type="xs:date"></xf-bind>
                        </xf-bind>
            
                    </xf-model>
            
                </xf-form>
            `)
        );

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
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting>Hello World!</greeting>
                            </data>
                        </xf-instance>
                        <xf-bind id="greeting" ref="greeting">
                            <xf-bind ref="." required="true()"></xf-bind>
                        </xf-bind>
                    </xf-model>
                </xf-form>               
            `)
        );

        await elementUpdated(el);
        const bind1 = document.getElementById('greeting');
        expect(bind1).to.exist;

        const model = document.getElementById('model1');
        expect(model.modelItems.length).to.equal(1);
        expect(model.modelItems[0].required).to.equal(true);

    });


    it('uses closest binding expr', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting>Hello World!</greeting>
                            </data>
                        </xf-instance>
                        <xf-bind id="greeting" ref="greeting">
                            <xf-bind required="true()"></xf-bind>
                        </xf-bind>
                    </xf-model>
                </xf-form>               
            `)
        );

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
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting>Hello World!</greeting>
                            </data>
                        </xf-instance>
                    </xf-model>
                    <xf-output id="output" ref="greet"></xf-output>

                </xf-form>               
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
        const el =  (
            await fixture(html`
                 <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting type="message">Hello World!</greeting>
                            </data>
                        </xf-instance>
                        <xf-bind id="b-greeting" ref="greeting" required="1 = 1">
                            <xf-bind id="b-type" ref="@type"></xf-bind>
                        </xf-bind>
                    </xf-model>
                    <xf-group>
                        <xf-output id="output1" ref="greeting"> </xf-output> : <xf-output id="output2" ref="greeting/@type"></xf-output>
                    </xf-group>
                </xf-form>               
            `)
        );

        await elementUpdated(el);
        const bind = document.getElementById('b-greeting');
        expect(bind).to.exist;

        const model = document.getElementById('model1');
        expect(model.modelItems.length).to.equal(2);

        //check the modelitems
        const mi = model.modelItems[0];
        expect(mi.node).to.exist;
        expect(mi.node.textContent).to.equal('Hello World!');

        const mi2 = model.modelItems[1];
        expect(mi2.node).to.exist;
        expect(mi2.node.nodeType).to.equal(2);//attribute
        expect(mi2.node.nodeName).to.equal("type");//attribute
        expect(mi2.node.textContent).to.equal('message');

        //check the controls
        const out1 = document.getElementById('output1');
        expect(out1.nodeName).to.equal('XF-OUTPUT');
        expect(out1.modelItem).to.exist;
        console.log('modelItem ', out1.getModelItem());

        expect(out1.getModelItem()).to.equal(mi);
        expect(out1.getModelItem().node.nodeType).to.equal(1);
        expect(out1.ref).to.equal('greeting');
        expect(out1.getModelItem().value).to.equal('Hello World!');


        expect(out1.value).to.equal('Hello World!');

        const out2 = document.getElementById('output2');
        expect(out2.nodeName).to.equal('XF-OUTPUT');
        expect(out2.nodeset).to.exist;
        console.log('++++++++++++ nodeset ',out2.nodeset);
        console.log('++++++++++++ nodeset ',out2.nodeset.parentNode);
        expect(out2.ref).to.equal('greeting/@type');
        expect(out2.value).to.equal('message');
    });



});