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
            }
        };
    }

    constructor() {
        super();
        this.model = null;
    }

    init(model){
        // console.log('init ', this);
        this.model = model;
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

    _inScopeContext(){
        let resultNodeset;

        // console.log('this ', this);
        // console.log('this ', this.parentNode);

        const parentBind = this.parentNode.closest('[ref]');
        // console.log('parentBind ', parentBind);

        if(parentBind !== null){
            resultNodeset = parentBind.nodeset;
        }else if(XPathUtil.isAbsolutePath(this.ref)){
            resultNodeset = this.model.getInstance(this.instanceId).getDefaultContext();
        }else if(this.model.getDefaultInstance() !== null){
            resultNodeset = this.model.getDefaultInstance().getDefaultContext();
        }else{
            return [];
        }

        // console.log('_inScopeContext ', resultNodeset);
        // todo: no support for xforms 'context' yet - see https://github.com/betterFORM/betterFORM/blob/02fd3ec595fa275589185658f3011a2e2e826f4d/core/src/main/java/de/betterform/xml/xforms/XFormsElement.java#L451
        return resultNodeset;
    }


}

customElements.define('fore-element', ForeElement);