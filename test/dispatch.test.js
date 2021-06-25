/* eslint-disable no-unused-expressions */
import {html, fixtureSync, expect, elementUpdated, oneEvent} from '@open-wc/testing';

import '../index.js';
import * as fx from 'fontoxpath';

describe('fx-dispatch tests', () => {

    it('dispatches an event with a static property', async () => {
        const el = await fixtureSync(html`
            <fx-form>
                <fx-model>
                    <fx-instance>
                        <data></data>
                    </fx-instance>
                </fx-model>
                <fx-trigger>
                    <button>dispatch it</button>
                    <fx-dispatch event="foo" targetid="bar">
                        <fx-property name="string" value="aString"></fx-property>
                    </fx-dispatch>
                </fx-trigger>
            </fx-form>
            <div id="bar"></div>
    `);

        await oneEvent(el, 'refresh-done');

        const bar = document.getElementById('bar');
        bar.addEventListener('foo', (event) => {
            bar.innerText = event.detail.string;
        });

        const trigger = el.querySelector('fx-trigger');
        trigger.performActions();

        expect(bar.innerText).to.equal('aString');
    });

    it('dispatches an event with a dynamic property', async () => {
        const el = await fixtureSync(html`
            <fx-form>
                <fx-model>
                    <fx-instance>
                        <data>
                            <foo>fooVal</foo>
                            <bar>barVal</bar>
                        </data>
                    </fx-instance>
                </fx-model>
                <fx-trigger>
                    <button>dispatch it</button>
                    <fx-dispatch event="foo" targetid="bar">
                        <fx-property name="instance" expr="instance()"></fx-property>
                    </fx-dispatch>
                </fx-trigger>
            </fx-form>
            <div id="bar"></div>
    `);

        await oneEvent(el, 'refresh-done');

        const bar = document.getElementById('bar');
        bar.addEventListener('foo', (event) => {
            bar.innerText = event.detail.instance;
        });

        const trigger = el.querySelector('fx-trigger');
        trigger.performActions();

        expect(bar.innerText).to.equal('<data id="default">\n<foo>fooVal</foo>\n<bar>barVal</bar>\n</data>');
    });

    it('dispatches an event with a mixed properties', async () => {
        const el = await fixtureSync(html`
            <fx-form>
                <fx-model>
                    <fx-instance>
                        <data>
                            <foo>fooVal</foo>
                            <bar>barVal</bar>
                        </data>
                    </fx-instance>
                </fx-model>
                <fx-trigger>
                    <button>dispatch it</button>
                    <fx-dispatch event="foo" targetid="bar">
                        <fx-property name="instance" expr="instance('default')"></fx-property>
                        <fx-property name="string" value="aString"></fx-property>
                    </fx-dispatch>
                </fx-trigger>
            </fx-form>
            <div id="bar"></div>
            <div id="displayValue"></div>

    `);

        await oneEvent(el, 'refresh-done');

        const bar = document.getElementById('bar');
        const dVal = document.getElementById('displayValue');
        bar.addEventListener('foo', (event) => {
            bar.innerText = event.detail.instance;
            dVal.innerText = event.detail.string;
        });

        const trigger = el.querySelector('fx-trigger');
        trigger.performActions();

        expect(bar.innerText).to.equal('<data id="default">\n<foo>fooVal</foo>\n<bar>barVal</bar>\n</data>');
        expect(dVal.innerText).to.equal('aString');
    });

});
