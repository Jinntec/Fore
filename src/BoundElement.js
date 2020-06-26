import {LitElement, html, css} from 'lit-element';


import fx from '../output/fontoxpath.js';
import evaluateXPathToBoolean from '../output/fontoxpath.js';
import evaluateXPathToString from '../output/fontoxpath.js';
import evaluateXPathToFirstNode from '../output/fontoxpath.js';
import evaluateXPathToNodes from '../output/fontoxpath.js';
import evaluateXPath from '../output/fontoxpath.js';

export class BoundElement extends LitElement {


    static get properties() {
        return {
            ref: {
                type: String
            },
            modelId: {
                type: String
            },
            model: {
                type: Object
            },
            nodeset: {
                type: Object
            },
            contextNode: {
                type: Object
            }
        };
    }

    constructor() {
        super();
        this.ref = '';
        this.modelId = '';
        this.model = {};
        this.nodeset = null;
        this.contextNode = {};
    }

    evalBinding() {
        // console.log('BoundElement.evalBinding ref', this);
        // console.log('BoundElement.evalBinding ref', this.ref);
        // console.log('BoundElement.evalBinding model', this.model);
        let contextModel;
        if (this.modelId === '') {
            //default model - first in document order
            contextModel = document.querySelector('xf-model');
        } else {
            contextModel = document.querySelector('#' + this.modelId);
        }
        this.model = contextModel;
        // console.log('BoundElement.evalBinding contextModel: ', this.model);

        // console.log('parentNode ', this.parentNode);
        // console.log('parent context nodeset ', this.parentNode.nodeset);

        const repeatItem = this.closest('xf-repeatitem');
        // console.log('repeatItem found ', repeatItem);
        // if(repeatItem.index) {
        //     console.log('repeatItem index ', repeatItem.index);
        // }

        if (repeatItem) {
            // console.log('>>>>repeatItem nodeset ', repeatItem.nodeset);
            // console.log('>>>>#####repeatItem nodeset ', this);
/*
            if (this.nodeName === 'XF-REPEATITEM') {

            } else {
*/
                // const r = fx.evaluateXPath(this.ref, repeatItem.nodeset, null, {});
                const r = fx.evaluateXPathToFirstNode(this.ref, repeatItem.nodeset, null, {});
                // console.log('>>>>repeatItem nodeset ', r);
                return r;
            // }
        }

        if (this.parentNode && this.parentNode.nodeset) {
            // console.log('BoundElement.evalBinding parent ', this.parentNode)
            // return fx.evaluateXPath(this.ref, this.parentNode.nodeset, null, {});
            return fx.evaluateXPath(this.ref, this.parentNode.nodeset, null, {});

        } else {
            // update value
            // const result = contextModel.evalBinding(this.ref);
            return this.model.evalBinding(this.ref);
        }

        // return  result;
    }

    refresh() {
        // console.log('refreshing ', this);

        const repeatItem = this.closest('xf-repeatitem');


        // if (!repeatItem) {
            if (this.ref) {
                this.nodeset = this.evalBinding();
                // console.log('refreshing evaluated nodeset', this.nodeset);

                this.requestUpdate();
            }
        // }


    }

    setValue(node, newVal) {

        const m = this.getModelItem();
        // m.setNodeValue(newVal);

        if (node.nodeType === node.ATTRIBUTE_NODE) {
            node.nodeValue = newVal;
        } else {
            node.textContent = newVal;
        }

    }


    getValue() {
        // console.log('getValue nodeset ', this.nodeset);
        if (this.nodeset.nodeType === Node.ELEMENT_NODE) {
            return this.nodeset.textContent;
        }
        return this.nodeset;
        // return this.getModelItem().modelItem.value;
    }


    getModelItem() {
        return this.model.bindingMap.find(m => m.refnode === this.nodeset);
    }

}

customElements.define('bound-element', BoundElement);