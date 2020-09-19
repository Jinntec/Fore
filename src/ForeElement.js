import {LitElement, html, css} from 'lit-element';


import fx from './output/fontoxpath.js';
import {ModelItem} from './modelitem.js';

import {XPathUtil} from "./xpath-util";

// import parseScript from './output/fontoxpath.js';


export class ForeElement extends LitElement {


    static get properties() {
        return {
            model: {
                type: Object
            },
            repeated:{
                type:Boolean
            }
        };
    }

    constructor() {
        super();
        this.model = null;
        this.repeated = false;
    }

    getModel(){
        if(this.hasAttribute('model')){
            const modelId = this.getAttribute('model');
            return document.getElementById('modelId');
        }else{
            //defaults to first model in document order
            return document.querySelector('xf-model');
        }
    }


    evalInContext(){
        throw new Error('this function must be overwritten by xf-bind and UiElement classes');
    }

    isNotBound(){
        return !this.hasAttribute('ref');
    }

    isBound(){
        return this.hasAttribute('ref');
    }

    _getParentBindingElement(start){
        if(start.parentNode.host){
            const host = start.parentNode.host;
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
            return this.parentNode.nodeset;
        }

        let parentBind;
        if(this.parentNode.host){
            parentBind = this.parentNode.host;
        }else{
            parentBind = this.parentNode.closest('[ref]');
        }
        // const parentBind = this.parentNode.closest('[ref]');
        // console.log('parentBind ', parentBind);

        if(parentBind !== null){
            resultNodeset = parentBind.nodeset;
        }else if(XPathUtil.isAbsolutePath(this.ref)){
            resultNodeset = this.model.getInstance(this.instanceId).getDefaultContext();
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

customElements.define('fore-element', ForeElement);