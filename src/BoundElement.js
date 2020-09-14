import {LitElement, html, css} from 'lit-element';


import fx from './output/fontoxpath.js';
import {ModelItem} from './modelitem.js';

import {XPathUtil} from "./xpath-util";
import {ForeElement} from "./ForeElement";

// import parseScript from './output/fontoxpath.js';


export class BoundElement extends ForeElement {


    static get properties() {
        return {
            model: {
                type: Object
            },
            ref:{
                type:String
            }
        };
    }

    constructor() {
        super();
        this.model = {};
        this.ref="";
    }

    init(model){
        console.log('init ', this);
        this.model = model;
        this._initializeActions();
    }

    /**
     * evaluation of xf-bind and UiElements differ in details so that each class needs it's own implementation.
     */
    evalInContext(){
        throw new Error('this function must be overwritten by xf-bind and UiElement classes');
    }

    getBindingExpr() {
        return this.getAttribute('ref');
    }

    isNotBound(){
        return !this.hasAttribute('ref');
    }

    isBound(){
        return this.hasAttribute('ref');
    }

    _initializeActions(){

    }

}

customElements.define('bound-element', BoundElement);