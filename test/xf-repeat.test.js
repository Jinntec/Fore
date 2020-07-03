/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixture, fixtureSync, expect, elementUpdated, defineCE } from '@open-wc/testing';

/*
import '../src/xf-instance.js';
import '../src/modelitem.js';
import '../src/xf-model.js';
import '../src/xf-bind.js';
import '../src/xf-button.js';
import '../src/xf-repeat.js';
import '../src/xf-repeatitem.js';
*/
import '../src/xf-repeat.js';


describe('initialize repeat', () => {

    it('has initialized modelItems', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="record">
            
                        <xf-instance>
                            <data>
                                <task complete="false" due="2019-02-04">Pick up Milk</task>
                                <task complete="true" due="2019-01-04">Make tutorial part 1</task>
                            </data>
                        </xf-instance>
            
            
                        <xf-bind ref="task">
                            <xf-bind ref="./text()" required="true()"></xf-bind>
                            <xf-bind ref="@complete" type="xs:boolean"></xf-bind>
                            <xf-bind ref="@due" type="xs:date"></xf-bind>
                        </xf-bind>
            
                    </xf-model>
                    <xf-group>
                        <h1>todos</h1>
                           
                        <xf-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
                            <template>
                                <xf-input label="Task" ref="." id="task" type="text"></xf-input>
                            </template>
                        </xf-repeat>
                           
                        <xf-button label="append">
                            <xf-append repeat="todos" ref="task"></xf-append>
                        </xf-button>
                    </xf-group>
                </xf-form>
            `)
        );

        await elementUpdated(el);

        const model = document.getElementById('record');
        expect(model.bindingMap.length).to.equal(6);

        // some modelItem checks
        expect(model.bindingMap[0].modelItem.required).to.equal(true);
        expect(model.bindingMap[0].refnode.nodeName).to.equal('task');
        expect(model.bindingMap[0].modelItem.node.textContent).to.equal('Pick up Milk');


        expect(model.bindingMap[1].modelItem.required).to.equal(true);
        expect(model.bindingMap[1].refnode.nodeName).to.equal('task');
        expect(model.bindingMap[1].modelItem.node.textContent).to.equal('Make tutorial part 1');


        expect(model.bindingMap[2].refnode.nodeName).to.equal('complete'); //text node
        expect(model.bindingMap[2].refnode.nodeType).to.equal(2); //attribute node
        expect(model.bindingMap[2].modelItem.node.textContent).to.equal('false');


        expect(model.bindingMap[3].refnode.nodeName).to.equal('complete'); //text node
        expect(model.bindingMap[3].refnode.nodeType).to.equal(2); //attribute node
        expect(model.bindingMap[3].modelItem.node.textContent).to.equal('true');

        expect(model.bindingMap[4].refnode.nodeName).to.equal('due'); //text node
        expect(model.bindingMap[4].refnode.nodeType).to.equal(2); //attribute node
        expect(model.bindingMap[4].modelItem.node.textContent).to.equal('2019-02-04');

        expect(model.bindingMap[5].refnode.nodeName).to.equal('due'); //text node
        expect(model.bindingMap[5].refnode.nodeType).to.equal(2); //attribute node
        expect(model.bindingMap[5].modelItem.node.textContent).to.equal('2019-01-04');


    });

    it('has initialized repeat with 2 repeat items', async () => {
        const el =  (
            await fixtureSync(html`
                <xf-form>
                    <xf-model id="record">
            
                        <xf-instance>
                            <data>
                                <task complete="false" due="2019-02-04">Pick up Milk</task>
                                <task complete="true" due="2019-01-04">Make tutorial part 1</task>
                            </data>
                        </xf-instance>
            
            
                        <xf-bind ref="task">
                            <xf-bind ref="./text()" required="true()"></xf-bind>
                            <xf-bind ref="@complete" type="xs:boolean"></xf-bind>
                            <xf-bind ref="@due" type="xs:date"></xf-bind>
                        </xf-bind>
            
                    </xf-model>
            
                    <h1>todos</h1>
                       
                    <xf-repeat id="todos" ref="task" focus-on-create="task" id="r-todos">
                        <template>
                            <xf-input label="Task" ref="." id="task" type="text"></xf-input>
                        </template>
                    </xf-repeat>
                       
                    <xf-button label="append">
                        <xf-append repeat="todos" ref="task"></xf-append>
                    </xf-button>
            
                </xf-form>
            `)
        );

        await elementUpdated(el);

        const repeat =  document.getElementById('todos');
        const items = document.querySelectorAll('xf-repeatitem');
        console.log('items', items);
        expect(items.length).to.equal(2);

        const repeatNodes = repeat.nodeset;
        console.log('items', repeatNodes);

        expect(repeatNodes.length).to.equal(2);

    });


});