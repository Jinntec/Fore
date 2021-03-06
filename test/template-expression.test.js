/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE } from '@open-wc/testing';

import '../index.js';

describe('template expressions', () => {

    it('detects template expressions', async () => {
        const el =  (
            await fixtureSync(html`
            <xf-form>
                <xf-model>
                    <xf-instance>
                        <data>
                            <greeting>Hello Universe</greeting>
                        </data>
                    </xf-instance>
                </xf-model>

                <div class="static {greeting}">Greeting: {greeting} another {greeting}</div>
                <xf-input ref="greeting" label="greeting"></xf-input>


            </xf-form>
            `)
        );


        let { detail } = await oneEvent(el, 'refresh-done');
        expect(el.storedTemplateExpressions).to.exist;
        expect(el.storedTemplateExpressions.length).to.equal(2);
        expect(el.storedTemplateExpressions[0].expr).to.equal('static {greeting}');
        expect(el.storedTemplateExpressions[1].expr).to.equal('Greeting: {greeting} another {greeting}');

        const theDiv = el.querySelector('.static');
        expect(theDiv).to.be.equal(el.storedTemplateExpressions[0].parent);

        expect(theDiv.getAttribute('class')).to.equal('static Hello Universe');
        expect(theDiv.textContent).to.equal('Greeting: Hello Universe another Hello Universe');

    });




});