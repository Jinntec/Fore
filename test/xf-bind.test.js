/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE } from '@open-wc/testing';

import '../src/xf-instance.js';
import '../src/ui/xf-container.js';
import { ModelItem } from '../src/ModelItem.js';

describe('initialize bind', () => {

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
        expect(mi.valid).to.exist;
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
        expect(model.modelItems[0].required).to.equal(true);

    });




});