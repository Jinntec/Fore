import {LitElement, css} from 'lit-element';

import * as fontoxpath from './output/fontoxpath.js';
import fx from "./output/fontoxpath";
import evaluateXPathToNodes from './output/fontoxpath.js';

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
            /**
             * array of objects of the structure:
             * {
             *     refnode: [referred node],
             *     modelItem:[modelItem object]
             * }
             *
             * Each array entry represents one node <-> modelItem mapping.
             *
             */
            bindingMap:{
                type: Array
            },
            defaultContext:{
                type:Object
            }

        };
    }

    constructor() {
        super();
        this.id = '';
        this.instances = [];
        this.bindingMap = [];
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

                this.updateModel();
                // console.groupEnd();
                // console.log('dispatching model-construct-done');
                this.dispatchEvent(new CustomEvent('model-construct-done', {
                    composed: true,
                    bubbles: true,
                    detail: {model: this}
                }));
            } else {
                this.dispatchEvent(new CustomEvent('model-construct-done', {
                    composed: true,
                    bubbles: true,
                    detail: {model: this}
                }));
            }

    }

    /**
     * registers a binding mapping - called by xf-bind when initializing.
     *
     * @param refnode - the node referred to by binding
     * @param modelItem - the associated modelItem for given node
     */
    registerBinding(refnode, modelItem){
        // console.log('registerBinding ', refnode, modelItem);
        // console.log('registerBinding nodeType ', refnode.nodeType);
        const alreadyThere = this.bindingMap.findIndex(node => node.refnode === refnode);
        if(alreadyThere !== -1){
            this.bindingMap.splice(alreadyThere,1,{refnode: refnode, modelItem: modelItem});
        }else{
            this.bindingMap.push({refnode: refnode, modelItem: modelItem});
        }
        // console.log('MODEL registered bindings ', this.bindingMap);
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

        //reset
        this.bindingMap = [];

        // console.group('rebuild');


        //todo: recursive or flat processing of xf-bind elements?
        // -> flat: binds will take of their children themselves

        const binds = this.querySelectorAll('xf-model > xf-bind');
        binds.forEach(bind => {
            bind.init(this);
        });
        console.log('rebuild finished with modelItems ', this.bindingMap);
        console.groupEnd();
    //
    }

    recalculate() {
        // tbd
        console.log('### recalculate');
    }

    revalidate() {
        // tbd
        // console.log('revalidate');
        // console.log('revalidate instances ', this.instances);

        console.group('### revalidate');
        const binds = this.querySelectorAll('xf-bind');
        binds.forEach(bind => {
            // console.log('bind ', bind);
            // console.log('bind ', bind.ref);
            // console.log('instanceData ', this.getDefaultInstanceData());

            let contextNode =  fx.evaluateXPath(bind.ref, this.getDefaultInstanceData(), null, {});
            // console.log('evaluated context node ', contextNode);

            let result ='';
            if(bind.readonly !== 'false()'){
                // console.log('evaluating readonly expression', bind.readonly);
            }
            if(bind.required !== 'false()'){
                // console.log('evaluating required expression', bind.required);
                result =  fx.evaluateXPathToBoolean(bind.required, result, null, {});
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
        console.groupEnd();
    }

    getModelItem(node){
        return this.bindingMap.find(m => m.refnode === node);
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
        return this.instances[0].instanceData.firstElementChild;
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


        const out = this.bindingMap.find(node => node.refnode === result);
        // console.log('modelitem for bindingeExpr ', out);

        // console.log('modelitem for bindingExpr ', out);
        // console.log('modelitem for bindingExpr ', out.modelItem);
        // console.log('modelitem for bindingeExpr ', out.modelItem);

        // console.log('xf-model.evalBinding result: ', result);
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