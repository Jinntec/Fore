import {LitElement, css} from 'lit-element';

import fx from "fontoxpath";
import evaluateXPathToNodes from 'fontoxpath';
import * as fontoxpath from 'fontoxpath';

import {Fore} from './fore.js';

import './xf-instance.js';
import './xf-bind.js';

export class XfModel extends LitElement {

    static get styles() {
        return css`
            :host {
                display: none;
            }
        `;
    }

    static get properties() {
        return {
            id: {
                type: String
            },
            instances: {
                type: Array
            },
/*
            defaultInstance: {
                type: Object
            },
*/
            defaultContext:{
                type:Object
            },
            modelItems:{
                type:Array
            }

        };
    }

    constructor() {
        super();
        this.id = '';
        this.instances = [];
        this.modelItems = [];
        this.defaultContext = {};

        this.addEventListener('model-construct', this._modelConstruct);
        this.addEventListener('ready', this._ready);


    }

/*
    render() {
        return html`
             <slot></slot>
        `;
    }
*/

    _modelConstruct(e) {
        // console.log('MODEL::model-construct received ', this.id);


            const instances = this.querySelectorAll('xf-instance');

            if (instances.length > 0) {
                // console.group('init instances');
                instances.forEach(instance => {
                    instance.init();
                });
                this.instances = Array.from(instances);
                console.groupEnd();
                // console.log('model instances ', this.instances);

                // this._initOutermostBindings();

                this.updateModel();
                // console.groupEnd();
                // console.log('dispatching model-construct-done');
                this.dispatchEvent(new CustomEvent('model-construct-done', {
                    composed: true,
                    bubbles: true,
                    detail: {model: this}
               }));
            } else {
                // this._initOutermostBindings();
                this.dispatchEvent(new CustomEvent('model-construct-done', {
                    composed: true,
                    bubbles: true,
                    detail: {model: this}
                }));
            }

    }


    registerModelItem(modelItem){
        console.log('ModelItem registered ', modelItem);
        this.modelItems.push(modelItem);
    }

    /**
     * update action triggering the update cycle
     */
    updateModel() {
        this.rebuild();
        this.recalculate();
        this.revalidate();

    }

    rebuild() {
        console.group('### rebuild');

        // this will trigger evaluation of all bind elements of this model
        this._initOutermostBindings();

        console.log(`rebuild finished with modelItems ${this.modelItems.length} item(s)`, this.modelItems);
        console.groupEnd();
    //
    }

    recalculate() {
        // tbd
        console.log('### recalculate');


        this.modelItems.forEach(item => {
            console.log('recalculate modelItem ', item);

            const bind = item.bind;
            if(bind){
                console.log('bind for modelItem ', bind);


                // const compute = fx.evaluateXPath(bind.calculate, item.node, null, {});
                // const compute = fx.evaluateXPath(bind.calculate, item.node, null, {});

                if(bind){

                    const calculate = bind.calculate;
                    if(calculate){
                        const compute =  Fore.evaluateXPath (calculate, item.node, this, Fore.namespaceResolver) ;
                        item.value = compute;
                    }

                    const required = bind.required;
                    if(required){
                        const compute =  Fore.evaluateXPath (bind.required, item.node, this, Fore.namespaceResolver) ;
                        item.required = compute;
                    }

                    const readonly = bind.readonly;
                    if(readonly){

                    }


                }



                // const ro = evaluateXFormsXPathToBoolean(this.readonly, targetNode, this, this.namespaceResolver);

                // item.value = compute;
                console.log('computed ', compute);
            }
        });

        const binds = this.querySelectorAll('xf-bind[calculate]');
        binds.forEach(bind => {
            const contextNode = bind.nodeset[0];
            const compute = fx.evaluateXPath(bind.required, contextNode, null, {});
            this.getModelItem(contextNode).value = compute;
            console.log('computed ', compute);
        });

    }

    revalidate() {
        // tbd
        // console.log('revalidate');
        // console.log('revalidate instances ', this.instances);

        console.group('### revalidate');
        this.modelItems.forEach(modelItem =>{
            console.log('validating node ', modelItem.node);
        });
/*
        const binds = this.querySelectorAll('xf-bind');
        binds.forEach(bind => {
            // console.log('bind ', bind);
            console.log('bind ', bind.ref);
            // console.log('instanceData ', this.getDefaultInstanceData());

            if(this.ref === ''){
                return;
            }

            let contextNode =  fx.evaluateXPath(bind.ref, this.getDefaultContext(), null, {});
            console.log('evaluated context node ', contextNode);

            let result ='';
            if(bind.readonly !== 'false()'){
                console.log('evaluating readonly expression', bind.readonly);
                result =  fx.evaluateXPathToBoolean(bind.readonly, contextNode, null, {});
                console.log('readonly evaluated to', result);
            }
            if(bind.required !== 'false()'){
                // console.log('evaluating required expression', bind.required);
                result =  fx.evaluateXPathToBoolean(bind.required, contextNode, null, {});
                console.log('required evaluated to', result);
            }
            if(bind.relevant !== 'true()'){
                // console.log('evaluating relevant expression', bind.relevant);
            }
            if(bind.constraint !== 'true()'){
                // console.log('evaluating constraint expression', bind.constraint);
            }
            if(bind.type !== 'xs:string'){
                // console.log('evaluating type  expression', bind.type);
            }
        });
*/
        console.groupEnd();
    }

    getModelItem(node){
        return this.modelItems.find(m => m.node === node);
    }

    _initOutermostBindings(){
        console.group('### initialize bindings');

        this.modelItems = [];
        const binds = this.querySelectorAll('xf-model > xf-bind');
        binds.forEach(bind => {
            bind.init(this);
        });
        console.groupEnd();
    }


    _handleModelConstructDone(e){
        console.log('_handleModelConstructDone');
        this.refresh();
    }


    /**
     * get the default evaluation context for this model.
     * @returns {Element} the
     */
    getDefaultContext(){
        // console.log('getDefaultContext instanceData ', this.instances[0].instanceData);
        // console.log('getDefaultContext firstChild ', this.instances[0].instanceData.firstElementChild);
        // return this.instances[0].instanceData.firstElementChild;
        return this.instances[0].getDefaultContext();
    }

    getDefaultInstance(){
        return this.instances[0];
    }

    getDefaultInstanceData() {
        console.log('default instance data ',this.instances[0].instanceData);
        return this.instances[0].instanceData;
    }

    getInstance(id){
        console.log('getInstance ',id);
        console.log('instances ',this.instances);
        // console.log('instances array ',Array.from(this.instances));

        const instArray = Array.from(this.instances);
        return instArray.find(inst => inst.id === id);
    }


    evalBinding(bindingExpr){
        // console.log('MODEL.evalBinding ', bindingExpr);
        //default context of evaluation is always the default instance



        const result = this.instances[0].evalXPath(bindingExpr);


        return result;

    }

    _ready(e) {
        console.log('model is ready');
    }

    createRenderRoot() {
        /**
         * Render template without shadow DOM. Note that shadow DOM features like
         * encapsulated CSS and slots are unavailable.
         */
        return this;
    }



}

customElements.define('xf-model', XfModel);