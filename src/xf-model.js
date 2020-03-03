import {LitElement, css} from 'lit-element';

import * as fontoxpath from '../output/fontoxpath.js';
import fx from "../output/fontoxpath";
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
            }

        };
    }

    constructor() {
        super();
        this.id = '';
        this.instances = [];
        this.bindingMap = [];
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
        console.log('MODEL::model-construct received ', this.id);


            const instances = this.querySelectorAll('xf-instance');

            if (instances.length > 0) {
                console.group('init instances');
                instances.forEach(instance => {
                    instance.init();
                });
                this.instances = instances;
                console.groupEnd();
                // console.log('model instances ', this.instances);

                this.updateModel();
                console.log('dispatching model-construct-done');
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
        this.bindingMap.push({refnode: refnode, modelItem: modelItem});
        console.log('MODEL regsitered bindings ', this.bindingMap);
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

        //reset
        this.bindingMap = [];

        console.group('rebuild');

        //todo: recursive or flat processing of xf-bind elements?

        const binds = this.querySelectorAll('xf-model > xf-bind');
        binds.forEach(bind => {
            bind.contextNode = this.getDefaultInstanceData();
            let refNodes =  fx.evaluateXPath(bind.ref, this.getDefaultInstanceData(), null, {});
            // console.log('evaluated context node ', refNodes);
            bind.init(this, refNodes);

        });
        console.groupEnd();



    }

    recalculate() {
        // tbd
        console.log('recalculate');
    }

    revalidate() {
        // tbd
        // console.log('revalidate');
        // console.log('revalidate instances ', this.instances);

        console.group('revalidate');
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
                result =  fx.evaluateXPath(bind.required, result, null, {});
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

    _handleModelConstructDone(e){
        console.log('_handleModelConstructDone');
        this.refresh();
    }


    getDefaultInstanceData() {
        // console.log('default instance data ',this.instances[0].instanceData);
        // console.log('default instance data ',this.instances[0].instanceData.firstElementChild);
        return this.instances[0].instanceData.firstElementChild;
    }

    getContextItem(){
        return this.instances[0].instanceData;
    }

    evalBinding(bindingExpr){
        console.log('MODEL.evalBinding ', bindingExpr);
        //default context of evaluation is always the default instance

        const result = this.instances[0].evalXPath(bindingExpr);

        console.log('modelitem for bindingeExpr ', this.bindingMap);
        const out = this.bindingMap.find(node => node.refnode === result);

        console.log('modelitem for bindingeExpr ', out);
        console.log('modelitem for bindingeExpr ', out.modelItem);
        // console.log('modelitem for bindingeExpr ', out.modelItem);

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