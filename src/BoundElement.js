import {LitElement, html} from 'lit-element';



import fx from '../output/fontoxpath.js';
import evaluateXPathToBoolean from '../output/fontoxpath.js';
import evaluateXPathToString from '../output/fontoxpath.js';
import evaluateXPathToFirstNode from '../output/fontoxpath.js';
import evaluateXPathToNodes from '../output/fontoxpath.js';
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
            },
            contextNode:{
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
        this.contextNode={};
    }

    evalBinding(){
        console.log('BoundElement.evalBinding ref', this);
        console.log('BoundElement.evalBinding ref', this.ref);
        console.log('BoundElement.evalBinding model', this.model);
        let contextModel;
        if(this.modelId === ''){
            //default model - first in document order
            contextModel = document.querySelector('xf-model');
        }else {
            contextModel = document.querySelector('#'+ this.modelId);
        }
        this.model = contextModel;
        console.log('BoundElement.evalBinding contextModel: ', this.model);

        console.log('parent context nodeset ', this.parentNode.nodeset);


        if(this.parentNode && this.parentNode.nodeset){
            return fx.evaluateXPath(this.ref, this.parentNode.nodeset, null, {});

        }else{
            // update value
            // const result = contextModel.evalBinding(this.ref);
            return this.model.evalBinding(this.ref);
        }

        // return  result;
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
        // return this.nodeset.nodeValue;
        return this.nodeset;
    }

    setValue(node, newVal){
        if(node.nodeType === node.ATTRIBUTE_NODE){
            node.nodeValue = newVal;
        }else{
            node.textContent = newVal;
        }

    }

    getModelItem(){
        return  this.model.bindingMap.find(m => m.refnode === this.nodeset);
    }

}

customElements.define('bound-element', BoundElement);