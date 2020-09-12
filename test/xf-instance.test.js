/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE } from '@open-wc/testing';

import '../src/xf-instance.js';

describe('initialize instance', () => {

    it('has "default" as id', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-instance>
                    <data>
                        <foobar></foobar>
                    </data>
                </xf-instance>
               
            `)
        );

        await elementUpdated(el);
        expect(el.id).to.equal('default');

    });

    it('init creates instanceData', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-instance>
                    <data>
                        <foobar></foobar>
                    </data>
                </xf-instance>
               
            `)
        );

        el.init();
        await elementUpdated(el);
        expect(el.instanceData).to.exist;
        expect(el.instanceData.nodeType).to.equal(Node.DOCUMENT_NODE);
    });

    it('evaluates xpath in its default context', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-instance>
                    <data>
                        <foobar></foobar>
                    </data>
                </xf-instance>
               
            `)
        );

        el.init();
        await elementUpdated(el);
        const result = el.evalXPath('//foobar');
        expect(result).to.exist;
        expect(result.nodeType).to.equal(Node.ELEMENT_NODE);
        expect(result.nodeName).to.equal('foobar');
    });

    it('provides default evaluation context', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-instance>
                    <data>
                        <foobar></foobar>
                    </data>
                </xf-instance>
               
            `)
        );

        el.init();
        await elementUpdated(el);
        const context = el.getDefaultContext();
        expect(context).to.exist;
        expect(context.nodeType).to.equal(Node.ELEMENT_NODE);
        expect(context.nodeName).to.equal('data');
    });

    it('does NOT copy a "body" element from inline data', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-instance>
                    <data>
                        <body>
                            <arm side="left">
                                <hand>
                                    <finger index="3">middle</finger>
                                </hand>
                            </arm>
                        </body>
                    </data>
                </xf-instance>
               
            `)
        );

        el.init();
        await elementUpdated(el);
        const doc = el.getInstanceData();
        expect(doc).to.exist;

        const root = doc.documentElement;
        expect(root.nodeName).to.equal('data');
        console.log('root children ', root.children );

        let n = root.firstElementChild;
        expect(n.nodeName).to.equal('arm');

        n = n.firstElementChild;
        expect(n.nodeName).to.equal('hand');

        n = n.firstElementChild;
        expect(n.nodeName).to.equal('finger');
        expect(n.textContent).to.equal('middle');

    });

/*
    it('does NOT copy a "body" element from inline data', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-instance>
                    <data>
                        <body>
                            <arm side="left">
                                <hand>
                                    <finger index="3">middle</finger>
                                </hand>
                            </arm>
                        </body>
                    </data>
                </xf-instance>

            `)
        );

        el.init();
        await elementUpdated(el);
        const doc = el.getInstanceData();
        expect(doc).to.exist;

        const root = doc.documentElement;
        expect(root.nodeName).to.equal('data');
        console.log('root children ', root.children );

        const body = root.firstElementChild;
        expect(body.nodeName).to.equal('body');

        const arm = body.firstElementChild;
        expect(root.nodeName).to.equal('arm');

        const hand = arm.firstElementChild;
        expect(root.nodeName).to.equal('hand');

        const finger = hand.firstElementChild();
        expect(root.nodeName).to.equal('finger');
        expect(root.textContent).to.equal('middle');
    });
*/


});