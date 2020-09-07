import {LitElement, html, css} from 'lit-element';


import fx from './output/fontoxpath.js';
import {ModelItem} from './modelitem.js';

import evaluateXPathToBoolean from './output/fontoxpath.js';
import evaluateXPathToString from './output/fontoxpath.js';
import evaluateXPathToFirstNode from './output/fontoxpath.js';
import evaluateXPathToNodes from './output/fontoxpath.js';
import evaluateXPath from './output/fontoxpath.js';
import {XPathUtil} from "./xpath-util";

// import parseScript from './output/fontoxpath.js';

export class BoundElement extends LitElement {


    static get properties() {
        return {
            model: {
                type: Object
            },
            modelItem:{
                type:Object
            },
            ref:{
                type:String
            }
        };
    }

    constructor() {
        super();
        this.model = {};
        this.modelItem = {};
        this.ref="";
    }

    firstUpdated(_changedProperties) {
        console.log('firstUpdated ', this);
        this.init();
    }

    init(){

    }

    _evalInContext(){
        this.model = this.getModel();
        const inscopeContext = this._inScopeContext();

        if(this.ref===''){
            this.nodeset = inscopeContext;
        }else if(Array.isArray(inscopeContext)){

            inscopeContext.forEach((n,index) => {

                if(XPathUtil.isSelfReference(this.ref)){
                    this.nodeset = inscopeContext;
                }else{
                    const localResult = fx.evaluateXPathToFirstNode(this.ref, n, null, {namespaceResolver:  this.namespaceResolver});
                    console.log('local result: ', localResult);
                    this.nodeset.push(localResult);
                }
            });

        }else{
            this.nodeset = fx.evaluateXPathToNodes(this.ref, this.model.getDefaultInstance().getDefaultContext(), null, {namespaceResolver: this.namespaceResolver});

        }

    }

    _inScopeContext(){
        let resultNodeset;

        const parentBind = this.parentNode.closest('[ref]');
        console.log('parentBind ', parentBind);

        if(parentBind !== null){
            resultNodeset = parentBind.nodeset;
        }else if(XPathUtil.isAbsolutePath(this.ref)){
            resultNodeset = this.model.getInstance(this.instanceId).getDefaultContext();
        }else {
            resultNodeset = this.model.getDefaultInstance().getDefaultContext();
        }

        console.log('_inScopeContext ', resultNodeset);
        //todo: no support for xforms 'context' yet - see https://github.com/betterFORM/betterFORM/blob/02fd3ec595fa275589185658f3011a2e2e826f4d/core/src/main/java/de/betterform/xml/xforms/XFormsElement.java#L451
        return resultNodeset;
    }


    evalBinding() {
        this.model = this.getModel();

        // this._evalInContext();

/*
        const xqueryx = parseScript(
            bindingExpr,
            {
                language: evaluateXPath.XPATH_3_1_LANGUAGE
            },
            new slimdom.Document()
        );
        console.log('parsed expression: ', xqueryx);
*/

        this.model = this.getModel();

        const repeatItem = this.closest('xf-repeatitem');
        if (repeatItem) {
            // const r = fx.evaluateXPathToFirstNode(this.ref, repeatItem.nodeset, null, {});
            const r = fx.evaluateXPathToNodes(this.ref, repeatItem.nodeset, null, {});
            return r;
        }

        // if (this.parentNode && this.parentNode.nodeset) {
/*
        const outer = this.parentNode.closest('[ref]');
        if (outer) {
            console.log('ancestor bind ', outer);
            // console.log('BoundElement.evalBinding parent ', this.parentNode)
            // return fx.evaluateXPath(this.ref, this.parentNode.nodeset, null, {});
            // return fx.evaluateXPath(this.ref, this.parentNode.nodeset, null, {});
            return fx.evaluateXPathToFirstNode(this.ref, this.parentNode.nodeset, null, {});

        }
*/

        // update value
        // return this.model.evalBinding(this.ref);
        return this.model.evalBinding(this.ref);
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

        this.nodeset = this.evalBinding();
        const existed = this.model.getModelItem(this.nodeset);
        if(!existed){
            console.log('does not exist ', this.nodeset);
            return this.model.getDefaultInstance().lazyCreateModelItem(this.nodeset);
        }
        return existed;

    }

    getBindingExpr() {
        return this.getAttribute('ref');
    }

    isNotBound(){
        return !this.hasAttribute('ref');
    }


}

customElements.define('bound-element', BoundElement);