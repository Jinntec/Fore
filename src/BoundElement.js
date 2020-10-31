import {LitElement, html, css} from 'lit-element';


import fx from './output/fontoxpath.js';
import {ModelItem} from './modelitem.js';

import {XPathUtil} from "./xpath-util";
import {ForeElement} from "./ForeElement";
import {XfInstance} from './xf-instance.js';
import {XfBind} from './xf-bind.js';


import {Fore} from './fore.js';

// import parseScript from './output/fontoxpath.js';


export class BoundElement extends ForeElement {


    static get properties() {
        return {
            ... super.properties,
            model: {
                type: Object
            },
            ref:{
                type:String
            },
            modelItem:{
                type:Object
            }
        };
    }

    constructor() {
        super();
        this.model = {};
        this.modelItem = {};
        this.ref="";
    }

    /**
     * evaluation of xf-bind and UiElements differ in details so that each class needs it's own implementation.
     */
    evalInContext(){
        const inscopeContext = this._inScopeContext();

        if(this.ref===''){
            this.nodeset = inscopeContext;
        }else if(Array.isArray(inscopeContext)){

            inscopeContext.forEach((n,index) => {
                if(XPathUtil.isSelfReference(this.ref)){
                    this.nodeset = inscopeContext;
                }else{
                    const localResult = fx.evaluateXPathToFirstNode(this.ref, n, null, {namespaceResolver:  this.namespaceResolver});
                    // console.log('local result: ', localResult);
                    this.nodeset.push(localResult);
                }
            });

        }else{
            this.nodeset = fx.evaluateXPathToFirstNode(this.ref, inscopeContext, null, {namespaceResolver: this.namespaceResolver});
        }
        // console.log('UiElement evaluated to nodeset: ', this.nodeset);
    }


    getBindingExpr() {
        return this.getAttribute('ref');
    }

    getModelItem() {
        // return this.model.bindingMap.find(m => m.refnode === this.nodeset);
        // return this.getModel().bindingMap.find(m => m.refnode === this.nodeset);

        if(this.modelItem.node instanceof Node){
            // console.log('modelItem is already initialized ', this.modelItem);
            return this.modelItem;
        }

        this.evalInContext();
        //if the nodeset is null after evaluation we have a binding error
        /*
                if(this.nodeset === null){
                    this.dispatchEvent(new CustomEvent('binding-error', {
                        composed: true, bubbles: true, detail: {
                            "error-message": this.ref + ' does not point to anything.'
                        }
                    }));
                    return null;
                }
        */

        const existed = this.getModel().getModelItem(this.nodeset);
        if(!existed){
            // if(existed === undefined){
            console.log('does not exist ', this.nodeset);
            // const mi = this.getModel().getDefaultInstance().lazyCreateModelItem(this.ref,this.nodeset);
            // this.getModel().registerModelItem(mi);
            // return mi;
            // return this.getModel().getDefaultInstance().lazyCreateModelItem(this.getModel(), this.ref, this.nodeset);
            // return XfInstance.lazyCreateModelItem(this.getModel(), this.ref, this.nodeset);
            return XfBind.lazyCreateModelItem(this.getModel(), this.ref, this.nodeset);
        }
        return existed;
    }


}

customElements.define('bound-element', BoundElement);