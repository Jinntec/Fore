import {LitElement, html, css} from 'lit-element';


import fx from './output/fontoxpath.js';
import evaluateXPathToBoolean from './output/fontoxpath.js';
import evaluateXPathToString from './output/fontoxpath.js';
import evaluateXPathToFirstNode from './output/fontoxpath.js';
import evaluateXPathToNodes from './output/fontoxpath.js';
import evaluateXPath from './output/fontoxpath.js';

export class BoundElement extends LitElement {


    static get properties() {
        return {
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
        this.model = {};
        this.nodeset = null;
        this.contextNode = {};
    }

    evalBinding() {
        this.ref = this.getBindingExpr();

        const bindingExpr = this.getBindingExpr();
        this.model = this.getModel();

        const repeatItem = this.closest('xf-repeatitem');
        if (repeatItem) {
            // const r = fx.evaluateXPathToFirstNode(this.ref, repeatItem.nodeset, null, {});
            const r = fx.evaluateXPathToFirstNode(bindingExpr, repeatItem.nodeset, null, {});
            return r;
        }

        if (this.parentNode && this.parentNode.nodeset) {
            // console.log('BoundElement.evalBinding parent ', this.parentNode)
            // return fx.evaluateXPath(this.ref, this.parentNode.nodeset, null, {});
            // return fx.evaluateXPath(this.ref, this.parentNode.nodeset, null, {});
            return fx.evaluateXPath(bindingExpr, this.parentNode.nodeset, null, {});

        }

        // update value
        // return this.model.evalBinding(this.ref);
        return this.model.evalBinding(bindingExpr);
    }



    getModel() {
        // good enough as long as we have just one model
        return document.querySelector('xf-model');
    }

    getModelItem() {
        return this.model.bindingMap.find(m => m.refnode === this.nodeset);
    }

    getBindingExpr() {
        return this.getAttribute('ref');
    }


}

customElements.define('bound-element', BoundElement);