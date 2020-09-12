import {LitElement, html, css} from 'lit-element';

import {BoundElement} from "../BoundElement.js";
import {XPathUtil} from "../xpath-util";
import fx from "../output/fontoxpath.js";
import '../xf-model.js';

export class UiElement extends BoundElement {


    static get properties() {
        return {
            ...super.properties,
            modelItem:{
                type:Object
            }

        };
    }

    constructor() {
        super();
        this.modelItem = {};
    }

    init(model){
        super.init(model);
        // this.model = this.getModel();
        this.evalInContext();

        if(this.isBound()){
            this.modelItem = this.getModelItem();
        }
    }

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
        console.log('UiElement evaluated to nodeset: ', this.nodeset);
    }


    getModel() {
        // good enough as long as we have just one model
        return document.querySelector('xf-model');
    }


    getModelItem() {
        // return this.model.bindingMap.find(m => m.refnode === this.nodeset);
        // return this.getModel().bindingMap.find(m => m.refnode === this.nodeset);

        if(this.modelItem.node instanceof Node){
            console.log('modelItem is already initialized ', this.modelItem);
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

        const existed = this.model.getModelItem(this.nodeset);
        if(!existed){
        // if(existed === undefined){
            console.log('does not exist ', this.nodeset);
            return this.model.getDefaultInstance().lazyCreateModelItem(this.ref,this.nodeset);
        }
        return existed;
    }


    refresh () {
        // if(this.getBindingExpr()){
        //     this.nodeset = this.evalBinding();
        // }
    }


}

customElements.define('ui-element', UiElement);