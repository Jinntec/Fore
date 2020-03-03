/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE } from '@open-wc/testing';

import '../src/xf-instance.js';

describe('initialize bind', () => {

    it('is initialized', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="model1">
                        <xf-instance>
                            <data>
                                <greeting>Hello World!</greeting>
                            </data>
                        </xf-instance>
                        <xf-bind id="b-greeting" ref="greeting" required="1 = 1"></xf-bind>
                    </xf-model>
                </xf-form>               
            `)
        );

        await elementUpdated(el);
        const bind = document.getElementById('b-greeting');
        expect(bind).to.exist;

        const model = document.getElementById('model1');
        expect(model.bindingMap.length).to.equal(1);

        const mi = model.bindingMap[0];
        console.log('*****',mi);
        expect(mi.modelItem.value).to.exist;
        expect(mi.modelItem.value).to.equal('Hello World!');


        expect(mi.modelItem.readonly).to.exist;
        expect(mi.modelItem.required).to.exist;
        expect(mi.modelItem.required).to.equal(true);

        expect(mi.modelItem.relevant).to.exist;
        expect(mi.modelItem.valid).to.exist;
        expect(mi.modelItem.type).to.exist;


    });



});