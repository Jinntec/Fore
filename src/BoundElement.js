import {LitElement, html, css} from 'lit-element';


import fx from './output/fontoxpath.js';
import {ModelItem} from './modelitem.js';

import evaluateXPathToBoolean from './output/fontoxpath.js';
import evaluateXPathToString from './output/fontoxpath.js';
import evaluateXPathToFirstNode from './output/fontoxpath.js';
import evaluateXPathToNodes from './output/fontoxpath.js';
import evaluateXPath from './output/fontoxpath.js';

// import parseScript from './output/fontoxpath.js';

export class BoundElement extends LitElement {


    static get properties() {
        return {
            model: {
                type: Object
            },
            modelItem:{
                type:Object
            }
        };
    }

    constructor() {
        super();
        this.model = {};
        this.modelItem = {};
    }

    evalBinding() {
        this.ref = this.getBindingExpr();

        const bindingExpr = this.getBindingExpr();

/*
        const xqueryx = parseScript(
            bindingExpr,
            {
                language: evaluateXPath.XPATH_3_1_LANGUAGE
            },
            new slimdom.Document()
        );
        console.log('parsed expression: ', xqueryx);
*/

        this.model = this.getModel();

        const repeatItem = this.closest('xf-repeatitem');
        if (repeatItem) {
            // const r = fx.evaluateXPathToFirstNode(this.ref, repeatItem.nodeset, null, {});
            const r = fx.evaluateXPathToNodes(bindingExpr, repeatItem.nodeset, null, {});
            return r;
        }

        // if (this.parentNode && this.parentNode.nodeset) {
        const outer = this.parentNode.closest('[ref]');
        if (outer) {
            console.log('ancestor bind ', outer);
            // console.log('BoundElement.evalBinding parent ', this.parentNode)
            // return fx.evaluateXPath(this.ref, this.parentNode.nodeset, null, {});
            // return fx.evaluateXPath(this.ref, this.parentNode.nodeset, null, {});
            return fx.evaluateXPathToFirstNode(bindingExpr, this.parentNode.nodeset, null, {});

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
        // return this.model.bindingMap.find(m => m.refnode === this.nodeset);
        // return this.getModel().bindingMap.find(m => m.refnode === this.nodeset);

        if(this.modelItem.node instanceof Node){
            console.log('modelItem is already initialized ', this.modelItem);
            return this.modelItem;
        }

        const nodeset = this.evalBinding();
        return this.getModel().modelItems.find(m => m.node === nodeset);
    }

    getBindingExpr() {
        return this.getAttribute('ref');
    }

    isNotBound(){
        return !this.hasAttribute('ref');
    }


}

customElements.define('bound-element', BoundElement);