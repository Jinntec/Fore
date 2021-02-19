import * as fx from 'fontoxpath';
import {XPathUtil} from "./xpath-util.js";
// import {XfBind} from "./xf-bind.js";
import {XfModel} from "./xf-model.js";


// export class ForeElement extends LitElement {
export const foreElementMixin = (superclass) => class ForeElementMixin extends superclass {


    static get properties() {
        return {
            model: {
                type: Object
            },
            ref:{
                type:String
            },
            modelItem:{
                type:Object
            },
            repeated:{
                type:Boolean
            }
        };
    }

    constructor() {
        super();
        this.model = null;
        this.modelItem = {};
        this.ref = "";
        this.repeated = false;
    }

    getModel(){
        if(this.hasAttribute('model')){
            const modelId = this.getAttribute('model');
            return document.getElementById(modelId);
        }
        // defaults to first model in document order
        return document.querySelector('xf-model');
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


    isNotBound(){
        return !this.hasAttribute('ref');
    }

    isBound(){
        return this.hasAttribute('ref');
    }

    getBindingExpr() {
        if(this.hasAttribute('ref')){
            return this.getAttribute('ref');
        }
        // try to get closest parent bind
        const parent = this.parentNode.closest('[ref]');
        if (!parent) {
            return 'instance()'; // the default instance
        }
        return parent.getAttribute('ref');
    }

    _getParentBindingElement(start){
        if(start.parentNode.host){
            const {host} = start.parentNode;
            if(host.hasAttribute('ref')){
                return host;
            }
        }else if(start.parentNode){
            if(start.parentNode.hasAttribute('ref')){
                return this.parentNode;
            }else{
                this._getParentBindingElement(this.parentNode)
            }
        }
        return null;
    }

    getModelItem() {
        // return this.model.bindingMap.find(m => m.refnode === this.nodeset);
        // return this.getModel().bindingMap.find(m => m.refnode === this.nodeset);

        const mi = this.getModel().getModelItem(this.nodeset);
        if(mi){
            this.modelItem = mi;
        }
/*
        if(this.modelItem.node instanceof Node){
            // console.log('modelItem is already initialized ', this.modelItem);
            return this.modelItem;
        }
*/

        const repeated = this.closest('xf-repeatitem');
        let existed;
        if(repeated){
            const index = this.closest('xf-repeatitem').index;
            if(Array.isArray(this.nodeset)){
                existed = this.getModel().getModelItem(this.nodeset[index-1]);
            }else {
                existed = this.getModel().getModelItem(this.nodeset);
            }
        }else{
            existed = this.getModel().getModelItem(this.nodeset);
        }

        if(!existed){
            // if(existed === undefined){
            // console.log('does not exist ', this.nodeset);
            // const mi = this.getModel().getDefaultInstance().lazyCreateModelItem(this.ref,this.nodeset);
            // this.getModel().registerModelItem(mi);
            // return mi;
            // return this.getModel().getDefaultInstance().lazyCreateModelItem(this.getModel(), this.ref, this.nodeset);
            // return XfInstance.lazyCreateModelItem(this.getModel(), this.ref, this.nodeset);
            return XfModel.lazyCreateModelItem(this.getModel(), this.ref, this.nodeset);
        }
        return existed;
    }


    _inScopeContext(){
        let resultNodeset;

        // console.log('this ', this);
        // console.log('this ', this.parentNode);

/*
        if(this.nodeName.toUpperCase() === 'XF-REPEATITEM'){
            const index = this.index;
            console.log('>>>>>>>>>>< index ', index);
            return this.parentNode.host.nodeset[this.index -1];
        }
*/
        if(this.repeated){
            const parentItem = this.parentNode.closest('xf-repeatitem');
            return parentItem.nodeset;
        }

/*

        let parentBind;
        if(this.parentNode.host){
            parentBind = this.parentNode.host;
        }else{
            parentBind = this.parentNode.closest('[ref]');
        }
        // const parentBind = this.parentNode.closest('[ref]');
        // console.log('parentBind ', parentBind);
*/

        const parentBind = this.parentNode.closest('[ref]');

        if(parentBind !== null){
            resultNodeset = parentBind.nodeset;
        }else if(XPathUtil.isAbsolutePath(this.ref)){
            resultNodeset = this.getModel().getInstance(this.instanceId).getDefaultContext();
        }else if(this.getModel().getDefaultInstance() !== null){
            resultNodeset = this.getModel().getDefaultInstance().getDefaultContext();
        }else{
            return [];
        }

        // console.log('_inScopeContext ', resultNodeset);
        // todo: no support for xforms 'context' yet - see https://github.com/betterFORM/betterFORM/blob/02fd3ec595fa275589185658f3011a2e2e826f4d/core/src/main/java/de/betterform/xml/xforms/XFormsElement.java#L451
        return resultNodeset;
    }


}

