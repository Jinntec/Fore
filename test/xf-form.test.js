/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE, waitUntil } from '@open-wc/testing';

import '../src/xf-form.js';
import '../src/xf-model.js';
import '../src/xf-instance.js';
import '../src/xf-bind.js';

describe('initialize form', () => {


    it('model emits model-construct-done', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-model id="model1">
                </xf-model>   
            `)
        );

        setTimeout(() => el.modelConstruct());

        let { detail } = await oneEvent(el, 'model-construct-done');
        expect(detail.model.id).to.equal('model1');

    });

    it('ready event is emitted after first complete render', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting type="message:">Hello World!</greeting>
                            </data>
                        </xf-instance>
                    </xf-model>
                </xf-form>
            `)
        );

        let { detail } = await oneEvent(el, 'ready');
        expect(el.ready).to.be.true;

    });



    it('initialized model', async () => {
        const el = (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting>Hello World!</greeting>
                            </data>
                        </xf-instance>
                        <xf-instance id="second">
                            <data>
                                <outro>GoodBye</outro>
                            </data>
                        </xf-instance>
                        <xf-bind id="b-greeting" ref="greeting" required="1 = 1"></xf-bind>
                    </xf-model>
                </xf-form>
            `)
        );
        const model = el.querySelector('xf-model');
        // await model.updated();
        await elementUpdated(model);
        expect(model).to.exist;
        expect(model.id).to.equal('model1');
        expect(model.instances.length).to.equal(2);
    });

    it('created modelItem', async () => {
        const el = (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting>Hello World!</greeting>
                            </data>
                        </xf-instance>
                        <xf-instance id="second">
                            <data>
                                <greeting>GoodBye</greeting>
                            </data>
                        </xf-instance>
                        <xf-bind id="b-greeting" ref="greeting" required="1 = 1"></xf-bind>
                    </xf-model>
                </xf-form>
            `)
        );
        const model = el.querySelector('xf-model');
        // await model.updated();
        await elementUpdated(model);

        // there is one binding
        expect(el.model.modelItems.length).to.equal(1);

        const greetingMap = el.model.modelItems[0];

        //binding refers to <greeting> node
        expect(greetingMap.node.nodeName).to.equal('greeting');

        // modelitem is initialized to correct values
        const mi = greetingMap;
        expect(mi.readonly).to.equal(false);
        expect(mi.required).to.equal(true);
        expect(mi.relevant).to.equal(true);
        expect(mi.constraint).to.equal(true);
        // expect(mi.type).to.equal('xs:string');
    });

    it('has paper-dialog', async () => {
        const el = (
            await fixtureSync(html`
                <xf-form>
                    <xf-model>
                        <xf-instance>
                            <data></data>
                        </xf-instance>
                    </xf-model>
                </xf-form>
            `)
        );
        // await model.updated();
        // await elementUpdated(el);
        let { detail } = await oneEvent(el, 'refresh-done');
        console.log('el ',el);
        const dialog = el.shadowRoot.querySelector('paper-dialog');
        expect(dialog).to.exist;
        expect(dialog.id).to.be.equal('modalMessage');
    });


});