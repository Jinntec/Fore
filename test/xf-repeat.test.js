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
import '../src/ui/xf-repeat.js';
import {XfModel} from '../src/xf-model.js';


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
                            <xf-bind ref="." required="true()"></xf-bind>
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
        expect(model.modelItems.length).to.equal(6);

        // some modelItem checks
        expect(model.modelItems[0].node.nodeName).to.equal('task');
        expect(model.modelItems[0].value).to.equal('Pick up Milk');
        expect(model.modelItems[0].required).to.equal(true);

        expect(model.modelItems[1].node.nodeName).to.equal('task');
        expect(model.modelItems[1].value).to.equal('Make tutorial part 1');
        expect(model.modelItems[1].required).to.equal(true);

        expect(model.modelItems[2].node.nodeName).to.equal('complete'); //text node
        expect(model.modelItems[2].node.nodeType).to.equal(2); //attribute node
        expect(model.modelItems[2].value).to.equal('false');

        expect(model.modelItems[3].node.nodeName).to.equal('complete'); //text node
        expect(model.modelItems[3].node.nodeType).to.equal(2); //attribute node
        expect(model.modelItems[3].value).to.equal('true');

        expect(model.modelItems[4].node.nodeName).to.equal('due'); //text node
        expect(model.modelItems[4].node.nodeType).to.equal(2); //attribute node
        expect(model.modelItems[4].value).to.equal('2019-02-04');

        expect(model.modelItems[5].node.nodeName).to.equal('due'); //text node
        expect(model.modelItems[5].node.nodeType).to.equal(2); //attribute node
        expect(model.modelItems[5].value).to.equal('2019-01-04');


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

        const repeatNodes = repeat.nodeset;
        console.log('items', repeatNodes);

        expect(repeatNodes.length).to.equal(2);

        const items = repeat.querySelectorAll('xf-repeatitem');
        // const items = document.querySelectorAll('xf-repeatitem');
        // console.log('items', items);
        expect(items.length).to.equal(2);

        expect(repeat.getModel() instanceof XfModel).to.be.true;

        let m = repeat.getModel().getModelItem(repeatNodes[0]);
        console.log('repeatnode 1 ', m);
        console.log('repeatnode 1 ', m.value);

        expect(m.value).to.equal('Pick up Milk');

        //check if control has correct value
        const inputs = el.querySelectorAll('xf-input');

        expect(inputs.length).to.equal(2);



        m = repeat.getModel().getModelItem(repeatNodes[1]);
        console.log('repeatnode 1 ', m);
        console.log('repeatnode 1 ', m.value);

        expect(m.value).to.equal('Make tutorial part 1');




    });

    it('has initialized repeat with 2 repeat items within a outer group', async () => {
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

        const repeat =  document.getElementById('todos');

        const repeatNodes = repeat.nodeset;
        console.log('items', repeatNodes);

        expect(repeatNodes.length).to.equal(2);

        const items = document.querySelectorAll('xf-repeatitem');
        console.log('items', items);
        expect(items.length).to.equal(2);

        let m = repeat.getModel().getModelItem(repeatNodes[0]);
        console.log('repeatnode 1 ', m);
        console.log('repeatnode 1 ', m.value);

        expect(m.value).to.equal('Pick up Milk');

        m = repeat.getModel().getModelItem(repeatNodes[1]);
        console.log('repeatnode 1 ', m);
        console.log('repeatnode 1 ', m.value);

        expect(m.value).to.equal('Make tutorial part 1');




    });
    it('has initialized repeat with 2 repeat items and proper UI state', async () => {
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

        const inputs = el.querySelectorAll('xf-repeatitem xf-input');
        await elementUpdated(inputs);

        expect(inputs.length).to.equal(2);
        console.log('inputs ', inputs);
        expect(inputs[0].getAttribute('value')).to.equal('Pick up Milk');
        expect(inputs[0].value).to.equal('Pick up Milk');
        expect(inputs[1].getAttribute('value')).to.equal('Make tutorial part 1');
        expect(inputs[1].value).to.equal('Make tutorial part 1');

    });

    it('handles a modelItem for the repeat itself', async () => {
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
            
            
                        <xf-bind ref="task" readonly="count(../task) < 3">
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

        const repeat = el.querySelector('xf-repeat');
        await elementUpdated(repeat);


        // expect(repeat.getModelItem()).to.equal(null);


    });
    
    it('appends an item', async () => {
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
            
            
                        <xf-bind ref="task" readonly="count(../task) < 3">
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

        const button = el.querySelector('xf-button');
        await elementUpdated(button);

        button.performActions();

        const repeat = el.querySelector('xf-repeat');
        await elementUpdated(repeat);

        expect(repeat).to.exist;
        const rItems = repeat.querySelectorAll('xf-repeatitem');
        console.log('xf-repeat ', repeat);
        expect(rItems.length).to.equal(3);


        // expect(repeat.getModelItem()).to.equal(null);


    });


});