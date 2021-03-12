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
                    
                    <xf-input id="input1" label="A-label" ref="a">
                        <xf-alert>Constraint not valid</xf-alert>
                        <xf-hint>must be one character long</xf-hint>
                    </xf-input>

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

    it('has a control child with value "A"', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">  
                        <xf-instance>
                            <data>
                                <a>A</a>
                            </data>
                        </xf-instance>
                
                    </xf-model>
                    
                    <xf-input id="input1" label="A-label" ref="a">
                    </xf-input>

                </xf-form>`)
        );

        await elementUpdated(el);
        // let { detail } = await oneEvent(el, 'refresh-done');
        const input = document.getElementById('input1');
        expect(input.control).to.exist;
        console.log('control value ', input.control);
        expect(input.control.value).to.equal('A');
    });

/*
    it('listens for event', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <a>A</a>
                            </data>
                        </xf-instance>
                
                    </xf-model>
                    
                    <xf-input id="input1" label="A-label" ref="a">
                    </xf-input>
                    
                    
                </xf-form>`)
        );

        await elementUpdated(el);
        // let { detail } = await oneEvent(el, 'refresh-done');


        const input = document.getElementById('input1');
        input.value='baz';
        // let { detail } = await oneEvent(input, 'value-changed');
        input.setValue('baz');
        // const ctrl = input.shadowRoot.querySelector('#input');

        // input.control.value = 'baz';
        // console.log('input control', input.control);
        // input.control.blur();

        // const model = el.querySelector('xf-model');
        // model.updateModel();
        // el.refresh();




        await oneEvent(el, 'refresh-done');

        console.log('modelitem ', input.modelItem);
        // let { detail1 } = await oneEvent(input, 'value-changed');

        expect(input.modelItem.value).to.be.equal('baz');



    });
*/



});