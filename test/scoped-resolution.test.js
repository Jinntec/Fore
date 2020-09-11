/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE } from '@open-wc/testing';

import '../src/app.js';

describe('scoped resolution tests', () => {

    it('creates modelItem during refresh', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="record">
                        <xf-instance>
                            <data>
                                <arm side="left">
                                    <hand>
                                        <finger index="3">middle</finger>
                                    </hand>
                                </arm>
                            </data>
                        </xf-instance>
                        <xf-bind ref="arm">
                            <xf-bind ref="@side"></xf-bind>
                            <xf-bind ref="hand">
                                <xf-bind ref="finger">middle</xf-bind>
                            </xf-bind>
                        </xf-bind>
                    </xf-model>
                    <xf-group ref="arm">
                        <h1>hold up one finger!:
                            <xf-output ref="hand/finger" id="output"></xf-output>
                        </h1>
                        <h2>left or right?
                            <xf-output ref="@side"></xf-output>
                        </h2>
                    </xf-group>
                </xf-form>`)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');
        expect(model.modelItems.length).to.equal(4);
        /*

                const mi1 = model.modelItems[0];
                expect(mi1.value).to.equal('message:');
                expect(mi1.readonly).to.equal(false);
                expect(mi1.required).to.equal(false);
                expect(mi1.relevant).to.equal(true);
                expect(mi1.valid).to.equal(true);
                expect(mi1.type).to.equal('xs:string');

                const mi2 = model.modelItems[1];
                expect(mi2.value).to.equal('Hello World!');
                expect(mi2.readonly).to.equal(false);
                expect(mi2.required).to.equal(false);
                expect(mi2.relevant).to.equal(true);
                expect(mi2.valid).to.equal(true);
                expect(mi2.type).to.equal('xs:string');
        */


    });


});