import {LitElement, html, css} from 'lit-element';


import fx from '../output/fontoxpath.js';
/*
import evaluateXPathToBoolean from '../output/fontoxpath.js';
import evaluateXPathToString from '../output/fontoxpath.js';
import evaluateXPathToFirstNode from '../output/fontoxpath.js';
import evaluateXPathToNodes from '../output/fontoxpath.js';
import evaluateXPath from '../output/fontoxpath.js';
*/
import {BoundElement} from "../BoundElement.js";

export class UiElement extends BoundElement {


    static get properties() {
        return {
            ...super.properties
        };
    }

    constructor() {
        super();

    }

    refresh () {
        // if(this.getBindingExpr()){
        //     this.nodeset = this.evalBinding();
        // }
    }


}

customElements.define('ui-element', UiElement);