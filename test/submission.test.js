/* eslint-disable no-unused-expressions */
// eslint-disable-next-line no-unused-vars
import {html, fixtureSync, expect, oneEvent} from '@open-wc/testing';
import * as fx from 'fontoxpath';
import {Relevance} from '../src/relevance.js';

import '../index.js';

describe('submission tests', () => {
    it.skip('replaces the default data with response', async () => {
        const el = await fixtureSync(html`
            <fx-fore>
                <fx-send submission="submission" event="ready"></fx-send>
                <fx-model>
                    <data>
                        <greeting>Hello World!</greeting>
                        <prop></prop>
                        <class>dynamic</class>
                    </data>
                    <fx-submission
                            id="submission"
                            url="/base/test/answer.xml"
                            method="get"
                            replace="data"
                            data="default"
                    >
                    </fx-submission>
                </fx-model>
            </fx-fore>
        `);

        // const sm = el.querySelector('#submission');
        // expect(sm).to.exist;
        // sm.submit();
        // await oneEvent(el, 'refresh-done');

        // const sub = el.querySelector('#submission');
        // await oneEvent(sub, 'submit-done');
        const inst = el.querySelector('data');
        expect(inst).to.exist;
        expect(inst.data).to.exist;

        const sub = el.querySelector('#submission');
        await oneEvent(sub, 'submit-done');

        const answer = fx.evaluateXPathToString('//theAnswer/text()', inst.data, null, {});
        expect(answer).to.exist;
        console.log('ljsldkjflsfjkd', answer);
        // expect(answer.innerHTML).to.equal(42);
        expect(inst.data).to.equal(42);
    });

    it('selects relevant nodes', async () => {
        const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <data>
                        <vehicle>suv</vehicle>
                        <car>
                            <motor>electric</motor>
                        </car>
                        <thing>thing</thing>
                        <something>something</something>
                    </data>
                    <fx-bind ref="vehicle/@attr1" relevant="false()"></fx-bind>
                    <fx-bind ref="something" relevant="false()"></fx-bind>
                    <fx-submission id="submission" url="/submission2" replace="data"></fx-submission>
                </fx-model>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        const sm = el.querySelector('#submission');
        expect(sm).to.exist;
        await sm.submit();
        // const result = sm.selectRelevant('xml');
        const result = Relevance.selectRelevant(sm, 'xml');
        const vehicle = fx.evaluateXPath('vehicle', result, null, {});
        expect(vehicle).to.exist;

        const vehicleText = fx.evaluateXPathToBoolean("vehicle/text() = 'suv'", result, null, {});
        expect(vehicleText).to.be.true;

        const car = fx.evaluateXPath('exists(car)', result, null, {});
        expect(car).to.be.true;

        const motor = fx.evaluateXPath('car/motor/data()', result, null, {});
        expect(motor).to.equal('electric');

        const thing = fx.evaluateXPath('exists(thing)', result, null, {});
        expect(thing).to.be.true;

        const something = fx.evaluateXPath('exists(something)', result, null, {});
        expect(something).to.be.false;
    });

    it('filters non-relevant attrs', async () => {
        const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <data>
                        <vehicle attr1="a1" attr2="a2">suv</vehicle>
                        <car>
                            <motor type="otto">electric</motor>
                        </car>
                        <thing>thing</thing>
                        <something>something</something>
                    </data>
                    <fx-bind ref="vehicle/@attr1" relevant="false()"></fx-bind>
                    <fx-bind ref="car/motor/@type" relevant="false()"></fx-bind>
                    <fx-submission id="submission" url="/submission2" replace="data"></fx-submission>
                </fx-model>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        const sm = el.querySelector('#submission');
        expect(sm).to.exist;

        sm.evalInContext();
        // const result = sm.selectRelevant('xml');
        const result = Relevance.selectRelevant(sm, 'xml');
        const vehicle = fx.evaluateXPath('vehicle', result, null, {});
        expect(vehicle).to.exist;

        const vehicleText = fx.evaluateXPathToBoolean("vehicle/text() = 'suv'", result, null, {});
        expect(vehicleText).to.be.true;

        const vehicleAttr1 = fx.evaluateXPathToBoolean('exists(vehicle/@attr1)', result, null, {});
        expect(vehicleAttr1).to.be.false;

        const motorAttr = fx.evaluateXPathToBoolean('exists(car/motor/@type)', result, null, {});
        expect(motorAttr).to.be.false;
    });
    it('filter non-relevant textnodes', async () => {
        const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <data>
                        <vehicle attr1="a1" attr2="a2">suv</vehicle>
                        <car>
                            <motor type="otto">electric</motor>
                        </car>
                    </data>
                    <fx-bind ref="vehicle/text()" relevant="false()"></fx-bind>
                    <fx-bind ref="car/motor/text()" relevant="false()"></fx-bind>
                    <fx-submission id="submission" url="/submission2" replace="data"></fx-submission>
                </fx-model>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        const sm = el.querySelector('#submission');
        expect(sm).to.exist;

        sm.evalInContext();
        // const result = sm.selectRelevant('xml');
        const result = Relevance.selectRelevant(sm, 'xml');
        const vehicle = fx.evaluateXPathToBoolean('exists(vehicle/text())', result, null, {});
        expect(vehicle).to.be.false;

        const motor = fx.evaluateXPathToBoolean('exists(car/motor/text())', result, null, {});
        expect(motor).to.be.false;
    });

    it('supports "empty" for non-relevant nodes', async () => {
        const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <data>
                        <vehicle attr1="a1" attr2="a2">suv</vehicle>
                        <car>
                            <motor type="otto">electric</motor>
                        </car>
                    </data>
                    <fx-bind ref="vehicle/text()" relevant="false()"></fx-bind>
                    <fx-bind ref="car/motor/text()" relevant="false()"></fx-bind>
                    <fx-submission id="submission" url="/submission2" replace="none" nonrelevant="empty">
                    </fx-submission>
                </fx-model>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        const sm = el.querySelector('#submission');
        expect(sm).to.exist;

        sm.evalInContext();
        const result = Relevance.selectRelevant(sm, 'xml');
        const vehicle = fx.evaluateXPath('vehicle/text()', result, null, {});
        // expect(vehicle).to.be.true;
        expect(vehicle).to.be.empty;

        const motor = fx.evaluateXPath('car/motor/text()', result, null, {});
        expect(motor).to.be.empty;
    });

    it('supports serialization none ', async () => {
        const el = await fixtureSync(html`
            <fx-fore>
                <fx-send event="model-construct-done" submission="submission"></fx-send>

                <fx-model>
                    <data>
                        <vehicle attr1="a1" attr2="a2">suv</vehicle>
                        <car>
                            <motor type="otto">electric</motor>
                        </car>
                    </data>
                    <fx-submission
                            id="submission"
                            method="post"
                            url="#echo"
                            replace="data"
                            serialization="none"
                    >
                    </fx-submission>
                </fx-model>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        /*
            const sm = el.querySelector('#submission');
            expect(sm).to.exist;

            sm.submit();
            await oneEvent(sm, 'submit-done');
        */

        const inst = el.querySelector('data');
        console.log('instancedata', inst.data);
        expect(inst).to.exist;
        expect(inst.getData()).to.exist;
        expect(inst.getData().firstElementChild.nodeName).to.equal('data');
        expect(inst.getData().firstElementChild.childNodes).to.not.exist;
    });

    it('supports ref and targetref ', async () => {
        const el = await fixtureSync(html`
            <fx-fore>
                <!--        <fx-send event="ready" submission="submission" delay="3000"></fx-send>-->

                <fx-model>
                    <data>
                        <vehicle attr1="a1" attr2="a2">suv</vehicle>
                        <car>
                            <motor type="otto">electric</motor>
                        </car>
                    </data>
                    <data id="result">
                        <result></result>
                    </data>
                    <fx-submission
                            id="submission"
                            ref="vehicle"
                            method="post"
                            url="#echo"
                            replace="data"
                            data="result"
                            targetref="$result/result"
                    >
                    </fx-submission>
                </fx-model>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        const sm = el.querySelector('#submission');
        expect(sm).to.exist;
        sm.submit();

        const inst = el.querySelectorAll('data');
        expect(inst[1]).to.exist;
        expect(inst[1].data).to.exist;
        await oneEvent(sm, 'submit-done');

        expect(inst[1].data.firstElementChild.firstElementChild.textContent).to.equal('suv');
    });

    it('submits and replaces json ', async () => {
        const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <data data-type="json">
                        { "foo":"bar" }
                    </data>
                    <data id="response" data-type="json">{}</data>

                    <fx-submission
                            id="submission"
                            url="#echo"
                            method="POST"
                            replace="data"
                            data="response"
                    >
                        <fx-message event="submit-done"
                        >JSON Data have been submitted - replacing data
                        </fx-message
                        >
                    </fx-submission>
                </fx-model>
                <fx-group collapse="true">
                    <h1>Submission of JSON data</h1>
                    <fx-trigger>
                        <button>replace data with json</button>
                        <fx-send submission="submission"></fx-send>
                    </fx-trigger>
                    <fx-output ref="data()?foo">
                        <label slot="label">data()?foo =</label>
                    </fx-output>
                    <fx-output id="out" ref="$response?foo">
                        <label slot="label">This message comes from replaced data:</label>
                    </fx-output>
                </fx-group>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        const sm = el.querySelector('#submission');
        expect(sm).to.exist;
        sm.submit();

        const inst = el.querySelectorAll('data');
        expect(inst[1]).to.exist;
        expect(inst[1].data).to.exist;
        await oneEvent(sm, 'submit-done');

        expect(inst[1].data.foo).to.equal('bar');

        const out = el.querySelector('#out');
        expect(out.value).to.equal('bar');
    });

    it('preserves root node', async () => {
        const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <data data-src="base/test/submission-root-data.xml">
                    </data>

                    <data id="target">
                    </data>

                    <fx-submission id="sub1"
                                   url="#echo"
                                   method="post"
                                   replace="data"
                                   data="target">
                    </fx-submission>
                </fx-model>
                <fx-trigger>
                    <button>submit</button>
                    <fx-send submission="sub1"></fx-send>
                </fx-trigger>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        const sm = el.querySelector('#sub1');
        expect(sm).to.exist;
        sm.submit();

        const inst = el.querySelectorAll('data');
        expect(inst[1]).to.exist;
        expect(inst[1].data).to.exist;
        await oneEvent(sm, 'submit-done');

        const root = inst[1].data.firstElementChild;
        console.log(root);
        expect(root.nodeName).to.equal('place');
        expect(root.hasAttribute('xml:id')).to.be.true;
        expect(root.getAttribute('xml:id')).to.equal('G003584');

        expect(root.hasAttribute('xmlns')).to.be.true;
        expect(root.getAttribute('xmlns')).to.equal('http://www.tei-c.org/ns/1.0');


    });

    it('checks constraints and dispatches error when invalid', async () => {
        const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <data>
                        <item></item>
                        <fail></fail>
                    </data>
                    <fx-bind ref="item" constraint="false()"></fx-bind>

                    <fx-submission id="sub1"
                                   url="#echo"
                                   method="post"
                                   replace="none">
                        <fx-setvalue ref="fail" event="submit-error">true</fx-setvalue>
                    </fx-submission>
                </fx-model>
                <fx-output ref="fail"></fx-output>
                <fx-trigger>
                    <button>submit</button>
                    <fx-send submission="sub1"></fx-send>
                </fx-trigger>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        const sm = el.querySelector('#sub1');
        expect(sm).to.exist;
        sm.submit();

        await oneEvent(sm, 'submit-error');
        const out = el.querySelector('fx-output');
        expect(out.value).to.equal('true');
    });

    it('checks required and dispatches error when invalid', async () => {
        const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <data>
                        <item></item>
                        <fail></fail>
                    </data>
                    <fx-bind ref="item" required="true()"></fx-bind>

                    <fx-submission id="sub1"
                                   url="#echo"
                                   method="post"
                                   replace="none">
                        <fx-setvalue ref="fail" event="submit-error">true</fx-setvalue>
                    </fx-submission>
                </fx-model>
                <fx-output ref="fail"></fx-output>
                <fx-trigger>
                    <button>submit</button>
                    <fx-send submission="sub1"></fx-send>
                </fx-trigger>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        const sm = el.querySelector('#sub1');
        expect(sm).to.exist;
        sm.submit();

        await oneEvent(sm, 'submit-error');
        const out = el.querySelector('fx-output');
        expect(out.value).to.equal('true');
    });


});
