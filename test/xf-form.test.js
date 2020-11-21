/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE } from '@open-wc/testing';

import '../src/xf-form.js';
import '../src/xf-model.js';
import '../src/xf-instance.js';
import '../src/xf-bind.js';

describe('initialize form', () => {

    it('receives model-construct', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                    </xf-model>   
                </xf-form>
            `)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');
        setTimeout(() => el._triggerModelConstruct());

        let { detail } = await oneEvent(model, 'model-construct');
        expect(detail.model.id).to.equal('model1');

    });

    it('receives model-construct-done', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                    </xf-model>   
                </xf-form>
            `)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');

        setTimeout(() => el._triggerModelConstruct());

        let { detail } = await oneEvent(model, 'model-construct-done');
        expect(detail.model.id).to.equal('model1');

    });

    it('models receive ready event ', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                    </xf-model>   
                </xf-form>
            `)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');
        console.log('model Element', model);

        setTimeout(() => el._triggerModelConstruct());

        let { detail } = await oneEvent(model, 'ready');
        expect(detail.model.id).to.equal('model1');

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
        expect(el.models.length).to.equal(1);
        expect(el.models[0].id).to.equal('model1');
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
        expect(el.models[0].modelItems.length).to.equal(1);

        const greetingMap = el.models[0].modelItems[0];

        //binding refers to <greeting> node
        expect(greetingMap.node.nodeName).to.equal('greeting');

        // modelitem is initialized to correct values
        const mi = greetingMap;
        expect(mi.isReadonly).to.equal(false);
        expect(mi.isRequired).to.equal(true);
        expect(mi.isRelevant).to.equal(true);
        expect(mi.isValid).to.equal(true);
        // expect(mi.type).to.equal('xs:string');
    });

    it('has paper-dialog', async () => {
        const el = (
            await fixtureSync(html`
                <xf-form>
                </xf-form>
            `)
        );
        // await model.updated();
        await elementUpdated(el);
        const dialog = el.shadowRoot.querySelector('paper-dialog');
        expect(dialog).to.exist;
        expect(dialog.id).to.be.equal('modalMessage');
    });


});