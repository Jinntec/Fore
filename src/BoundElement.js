import {LitElement, html} from 'lit-element';

import fx from '../output/fontoxpath.js';
import evaluateXPathToBoolean from '../output/fontoxpath.js';
import evaluateXPathToString from '../output/fontoxpath.js';
import evaluateXPathToFirstNode from '../output/fontoxpath.js';
import evaluateXPath from '../output/fontoxpath.js';

export class BoundElement extends LitElement {


    static get properties() {
        return {
            ref:{
                type: String
            },
            model:{
                type: String
            },
            modelObj:{
                type: Object
            }
        };
    }

    constructor() {
        super();
        this.ref = '';
        this.model='';
        this.modelObj = {};
    }

    evalBinding(){
        let contextModel;
        if(this.model === ''){
            //default model - first in document order
            contextModel = document.querySelector('xf-model');
        }else {
            contextModel = document.querySelector('#'+ this.model);
        }
        this.modelObj = contextModel;
        // update value
        return  contextModel.evalBinding(this.ref);
    }



}

customElements.define('bound-element', BoundElement);