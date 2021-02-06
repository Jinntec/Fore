/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE } from '@open-wc/testing';

import '../src/app.js';
import * as fx from 'fontoxpath';

describe('setvalue tests', () => {

    it('creates modelItem during refresh', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting>Hello World!</greeting>
                            </data>
                        </xf-instance>
                    </xf-model>
                    
                    <xf-group>
                        <xf-output id="output" ref="greeting"></xf-output>
                        <xf-button id="btn" label="say 'hello Universe'">
                            <xf-setvalue ref="greeting" value="Hello Universe"></xf-setvalue>
                        </xf-button>
                    </xf-group>
                </xf-form>`)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');

        await elementUpdated(model);
        expect(model.modelItems.length).to.equal(1);

        const inst = model.getDefaultInstance().getDefaultContext();
        const xp = fx.evaluateXPath('greeting',inst,null,{});
        console.log('plain eval: ', xp);

        const btn = el.querySelector('#btn');
        btn.performActions();

        const out = el.querySelector('#output');
        expect(out.modelItem.value).to.equal('Hello Universe');

    });

    it('ignores setvalue actions with do not bind to a existing node', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting>Hello World!</greeting>
                            </data>
                        </xf-instance>
                    </xf-model>
                    
                    <xf-group>
                        <xf-output id="output" ref="greeting"></xf-output>
                        <xf-button id="btn" label="say 'hello Universe'">
                            <xf-setvalue ref="foo" value="Hello Universe"></xf-setvalue>
                        </xf-button>
                    </xf-group>
                </xf-form>`)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');

        await elementUpdated(model);
        expect(model.modelItems.length).to.equal(1);

        const inst = model.getDefaultInstance().getDefaultContext();
        const xp = fx.evaluateXPath('greeting',inst,null,{});
        console.log('plain eval: ', xp);

        const btn = el.querySelector('#btn');
        btn.performActions();

        const out = el.querySelector('#output');
        expect(out.modelItem.value).to.equal('Hello World!');

    });

    it('ignores uses element content if oresent', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting>Hello World!</greeting>
                            </data>
                        </xf-instance>
                    </xf-model>
                    
                    <xf-group>
                        <xf-output id="output" ref="greeting"></xf-output>
                        <xf-button id="btn" label="say 'hello Universe'">
                            <xf-setvalue ref="greeting">Hello Universe</xf-setvalue>
                        </xf-button>
                    </xf-group>
                </xf-form>`)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');

        await elementUpdated(model);
        expect(model.modelItems.length).to.equal(1);

        const inst = model.getDefaultInstance().getDefaultContext();
        const xp = fx.evaluateXPath('greeting',inst,null,{});
        console.log('plain eval: ', xp);

        const btn = el.querySelector('#btn');
        btn.performActions();

        const out = el.querySelector('#output');
        expect(out.modelItem.value).to.equal('Hello Universe');

    });

    it('defaults to empty string if neither value nor textContent are present', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting>Hello World!</greeting>
                            </data>
                        </xf-instance>
                    </xf-model>
                    
                    <xf-group>
                        <xf-output id="output" ref="greeting"></xf-output>
                        <xf-button id="btn" label="say 'hello Universe'">
                            <xf-setvalue ref="greeting"></xf-setvalue>
                        </xf-button>
                    </xf-group>
                </xf-form>`)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');

        await elementUpdated(model);
        expect(model.modelItems.length).to.equal(1);

        const inst = model.getDefaultInstance().getDefaultContext();
        const xp = fx.evaluateXPath('greeting',inst,null,{});
        console.log('plain eval: ', xp);

        const btn = el.querySelector('#btn');
        btn.performActions();

        const out = el.querySelector('#output');
        expect(out.modelItem.value).to.equal('');

    });


});