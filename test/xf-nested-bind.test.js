/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE } from '@open-wc/testing';

import '../src/xf-form.js';
import '../src/xf-model.js';
import '../src/xf-instance.js';
import '../src/xf-bind.js';
import '../src/ui/xf-output.js';

describe('initialize nested bindings', () => {

    it('is initialized', async () => {
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

        /*
                const out2 = document.getElementById('output2');
                expect(out2.nodeName).to.equal('XF-OUTPUT');
                expect(out2.nodeset).to.exist;
                console.log('++++++++++++ nodeset ',out2.nodeset);
                console.log('++++++++++++ nodeset ',out2.nodeset.parentNode);
                expect(out2.ref).to.equal('greeting/@type');
                expect(out2.value).to.equal('message');
        */
    });




});