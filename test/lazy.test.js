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
        const model = el.querySelector('xf-model');
        expect(model.modelItems.length).to.equal(2);

        const mi1 = model.modelItems[0];
        expect(mi1.value).to.equal('message:');
        expect(mi1.isReadonly).to.equal(false);
        expect(mi1.isRequired).to.equal(false);
        expect(mi1.isRelevant).to.equal(true);
        expect(mi1.isValid).to.equal(true);
        expect(mi1.type).to.equal('xs:string');

        const mi2 = model.modelItems[1];
        expect(mi2.value).to.equal('Hello World!');
        expect(mi2.isReadonly).to.equal(false);
        expect(mi2.isRequired).to.equal(false);
        expect(mi2.isRelevant).to.equal(true);
        expect(mi2.isValid).to.equal(true);
        expect(mi2.type).to.equal('xs:string');


    });


});