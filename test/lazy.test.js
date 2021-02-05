/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE } from '@open-wc/testing';

import '../src/app.js';

describe('lazy initialize modelItem', () => {

    it('creates modelItem during refresh', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-message event="refresh-done">refresh has been done</xf-message>
                
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting type="message:">Hello World!</greeting>
                            </data>
                        </xf-instance>
                    </xf-model>
                    
                    <xf-group>
                        <h1 class="{class}">
                            lazy greeting
                        </h1>
                        <xf-output id="output" ref="greeting/@type"></xf-output>
                        <xf-output id="output" ref="greeting"></xf-output>
                    </xf-group>
                </xf-form>`)
        );

        await elementUpdated(el);

        // await elementUpdated(model);
        let { detail } = await oneEvent(el, 'refresh-done');
        const model = el.querySelector('xf-model');
        console.log('modelitems ', model.modelItems);
        expect(model.modelItems.length).to.equal(2);

        const mi1 = model.modelItems[0];
        expect(mi1.value).to.equal('message:');
        expect(mi1.readonly).to.equal(false);
        expect(mi1.required).to.equal(false);
        expect(mi1.relevant).to.equal(true);
        expect(mi1.constraint).to.equal(true);
        expect(mi1.type).to.equal('xs:string');
        expect(mi1.path).to.equal('/greeting[1]/@type');


        const mi2 = model.modelItems[1];
        expect(mi2.value).to.equal('Hello World!');
        expect(mi2.readonly).to.equal(false);
        expect(mi2.required).to.equal(false);
        expect(mi2.relevant).to.equal(true);
        expect(mi2.constraint).to.equal(true);
        expect(mi2.type).to.equal('xs:string');
        expect(mi2.path).to.equal('/greeting[1]');



    });

    it('creates a model when there is none', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                </xf-form>`)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');
        expect(model).to.exist;
    });

    it('constructs an instance when there is none', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-group ref="outer">
                        <xf-output ref="inner1">inner1</xf-output>
                        <xf-output ref="inner2">inner2</xf-output>
                    </xf-group>
                </xf-form>`)
        );

        await elementUpdated(el);
        let { detail } = await oneEvent(el, 'refresh-done');

        const inst = el.querySelector('xf-instance');
        console.log('++++++++++++ inst ', inst);
        // await elementUpdated(inst);
        expect(inst).to.exist;

    });


});