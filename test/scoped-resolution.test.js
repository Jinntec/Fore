/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE } from '@open-wc/testing';

import '../src/app.js';

describe('scoped resolution tests', () => {

    it('inscopeContext for child bind is equal to its parent', async () => {
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
                        <xf-bind id="parent" ref="arm">
                            <xf-bind id="child" ref="@side"></xf-bind>
                        </xf-bind>
                    </xf-model>
                </xf-form>`)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');
        expect(model.modelItems.length).to.equal(2);

        const parent = el.querySelector('#parent');
        const child = el.querySelector('#child');


        const c = child._inScopeContext()
        expect(child._inScopeContext()).to.equal(parent.nodeset);
    });

    it('inscopeContext for second child bind is equal to its parent', async () => {
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
                        <xf-bind id="parent" ref="arm">
                            <xf-bind id="child1" ref="@side"></xf-bind>
                            <xf-bind id="child2" ref="hand"></xf-bind>
                        </xf-bind>
                    </xf-model>
                </xf-form>`)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');
        expect(model.modelItems.length).to.equal(3);

        const parent = el.querySelector('#parent');
        const child = el.querySelector('#child2');
        const c = child._inScopeContext()
        expect(child._inScopeContext()).to.equal(parent.nodeset);
    });

    it('inscopeContext for subchild bind is equal to its parent', async () => {
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
                        <xf-bind id="parent" ref="arm">
                            <xf-bind id="child1" ref="@side"></xf-bind>
                            <xf-bind id="child2" ref="hand">
                                <xf-bind id="subchild" ref="finger"></xf-bind>
                            </xf-bind>
                        </xf-bind>
                    </xf-model>
                </xf-form>`)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');
        expect(model.modelItems.length).to.equal(4);

        const child = el.querySelector('#child2');
        const subchild = el.querySelector('#subchild');

        const c = subchild._inScopeContext()
        expect(c).to.equal(child.nodeset);
    });

    it('has 2 arms as nodeset', async () => {
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
                                <arm side="right">
                                    <hand>
                                        <finger index="4">ring</finger>
                                    </hand>
                                </arm>
                            </data>
                        </xf-instance>
                        <xf-bind id="parent" ref="arm">
                            <xf-bind id="child1" ref="@side"></xf-bind>
                            <xf-bind id="child2" ref="hand">
                                <xf-bind id="subchild" ref="finger"></xf-bind>
                            </xf-bind>
                        </xf-bind>
                    </xf-model>
                </xf-form>`)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');
        // expect(model.modelItems.length).to.equal(8);

        const parent = el.querySelector('#parent');
        expect(parent.nodeset.length).to.equal(2);
    });

    it('has a 3 finger nodeset for the left arm', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="record">
                        <xf-instance>
                            <data>
                                <arm side="left">
                                    <hand>
                                        <finger index="2">pointer</finger>
                                        <finger index="3">middle</finger>
                                        <finger index="4">ring</finger>
                                    </hand>
                                </arm>
                                <arm side="right">
                                    <hand>
                                        <finger index="4">ring</finger>
                                    </hand>
                                </arm>
                            </data>
                        </xf-instance>
                        <xf-bind id="parent" ref="arm">
                            <xf-bind id="child1" ref="@side"></xf-bind>
                            <xf-bind id="child2" ref="hand">
                                <xf-bind id="subchild" ref="finger"></xf-bind>
                            </xf-bind>
                        </xf-bind>
                    </xf-model>
                </xf-form>`)
        );

        await elementUpdated(el);
        const model = el.querySelector('xf-model');
        expect(model.modelItems.length).to.equal(10);

        const parent = el.querySelector('#parent');
        expect(parent.nodeset.length).to.equal(2);
    });

    it('correctly binds form controls', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="record">
                        <xf-instance>
                            <data>
                                <arm side="left">
                                    <hand>
                                        <finger index="2">index</finger>
                                    </hand>
                                </arm>
                                <arm side="right">
                                    <hand>
                                        <finger index="3">middle</finger>
                                    </hand>
                                </arm>
                            </data>
                        </xf-instance>
                        <xf-bind ref="arm">
                            <xf-bind ref="hand">
                                <xf-bind ref="finger">middle</xf-bind>
                            </xf-bind>
                        </xf-bind>
                    </xf-model>
                    <xf-group ref="arm">
                        <h1>hold up one finger!:
                            <xf-output ref=".[1]/hand/finger" id="output"></xf-output>
                        </h1>
                        <h2>left or right?
                            <xf-output id="output2" ref="@side"></xf-output>
                            <xf-output id="output3" ref="/data/arm[2]/@side"></xf-output>
                        </h2>
                    </xf-group>
                </xf-form>`)
        );

        const model = el.querySelector('xf-model');

        let { detail } = await oneEvent(el, 'refresh-done');
        console.log('model ', detail);
        expect(model.modelItems.length).to.equal(8);

        let out = el.querySelector('#output');
        expect(out.modelItem.value).to.equal('index');

        out = el.querySelector('#output3');
        expect(out.modelItem.value).to.equal('right');

    });

/*
    it('dispatches a bind exception for non-existing ref', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="record">
                        <xf-instance>
                            <data>
                                <foo></foo>
                            </data>
                        </xf-instance>
                        <xf-bind ref="bar"></xf-bind>
                    </xf-model>
                    <xf-group ref="bar">
                    </xf-group>
                </xf-form>`)
        );

        await elementUpdated(el);
/!*
        const model = el.querySelector('xf-model');
        expect(model.modelItems.length).to.equal(8);

        let out = el.querySelector('#output');
        expect(out.modelItem.value).to.equal('index');

        out = el.querySelector('#output3');
        expect(out.modelItem.value).to.equal('right');
*!/

    });
*/


});