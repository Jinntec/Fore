import {LitElement, html} from 'lit-element';


import fx from '../output/fontoxpath.js';
import evaluateXPathToBoolean from '../output/fontoxpath.js';
import evaluateXPathToString from '../output/fontoxpath.js';
import evaluateXPathToFirstNode from '../output/fontoxpath.js';
import evaluateXPathToNodes from '../output/fontoxpath.js';
import evaluateXPath from '../output/fontoxpath.js';


/**
 * Class for holding ModelItem facets.
 *
 * A ModelItem annotates nodes that are referred by a xf-bind element with facets for calculation and validation.
 *
 * Each bound node in an instance has exactly one ModelItem associated with it.
 */
export class ModelItem extends LitElement {


    static get properties() {
        return {
            readonly: {
                type: Boolean
            },
            relevant: {
                type: Boolean
            },
            required: {
                type: Boolean
            },
            valid: {
                type: Boolean
            },
            value: {
                type: String
            }
        };
    }

    constructor() {
        super();
        this.readonly = false;
        this.relevant = true;
        this.required = false;
        this.valid = true;
        this.value = '';
    }


    getValue() {
    }

    setValue(node, newVal) {
    }

}

customElements.define('model-item', ModelItem);