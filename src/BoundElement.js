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
            modelId:{
                type: String
            },
            model:{
                type:Object
            },
            nodeset:{
                type:Object
            }
        };
    }

    constructor() {
        super();
        this.ref = '';
        this.modelId='';
        this.model = {};
        this.nodeset = {};
    }

    evalBinding(){
        console.log('BoundElement.evalBinding ref', this);
        console.log('BoundElement.evalBinding ref', this.ref);
        let contextModel;
        if(this.modelId === ''){
            //default model - first in document order
            contextModel = document.querySelector('xf-model');
        }else {
            contextModel = document.querySelector('#'+ this.modelId);
        }
        this.model = contextModel;
        // update value
        return  contextModel.evalBinding(this.ref);
    }

    refresh(){
        console.log('refreshing ', this);

        this.nodeset = this.evalBinding();
        this.requestUpdate();
    }

    getValue (){

        if(this.nodeset.nodeType === Node.ELEMENT_NODE){
            return this.nodeset.childNodes[0].nodeValue;
        }
        return this.nodeset.nodeValue;
    }

}

customElements.define('bound-element', BoundElement);