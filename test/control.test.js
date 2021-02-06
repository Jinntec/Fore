/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE } from '@open-wc/testing';

import '../src/app.js';

describe('control tests', () => {

    it('shows control alert defined on control', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <a>Aa</a>
                                <b>B</b>
                                <c>C</c>
                            </data>
                        </xf-instance>
                
                        <xf-bind ref="a" constraint="string-length(.) = 1"></xf-bind>
                        <xf-bind ref="b" constraint="string-length(.) = 1" alert="string must be exactly one character long"></xf-bind>
                        <xf-bind ref="c" constraint="string-length(.) = 1">
                            <xf-alert><b>string must be exactly 1 character long</b></xf-alert>
                        </xf-bind>
                    </xf-model>
                    
                    <input id="input1" label="A-label" ref="a">
                        <xf-alert>Constraint not valid</xf-alert>
                        <xf-hint>must be one character long</xf-hint>
                    </input>

                    <xf-input id="input2" label="B-label" ref="b">
                        <xf-alert id="alert1">Constraint not valid</xf-alert>
                        <xf-hint>must be one character long</xf-hint>
                    </xf-input>

                </xf-form>`)
        );

        await elementUpdated(el);

        // let { detail } = await oneEvent(el, 'refresh-done');

        /*
        WOW - crazy - using an id of 'input' somehow makes SVG from the controls - weird
         */
        const input = document.getElementById('input1');
        const alert1 = document.getElementById('alert1');
        console.log('alert1 ', alert1);
        expect(alert1).to.exist;
        expect(alert1).to.be.visible;
        expect(alert1.firstElementChild).to.be.null; // should not contain further elements


        const input2 = document.getElementById('input2');
        const alert2 = input2.firstElementChild;
        console.log('alert 21 ', alert2);
        expect(alert1).to.exist;
        expect(alert2.getAttribute('style')).to.equal('display: none;');



    });



});