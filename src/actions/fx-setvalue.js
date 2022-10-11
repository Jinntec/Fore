// import { FxAction } from './fx-action.js';
import '../fx-model.js';
import {AbstractAction} from './abstract-action.js';
import {evaluateXPath} from '../xpath-evaluation.js';

/**
 * `fx-setvalue`
 *
 * @customElement
 */
export default class FxSetvalue extends AbstractAction {
    static get properties() {
        return {
            ...super.properties,
            ref: {
                type: String,
            },
            valueAttr: {
                type: String,
            },
        };
    }

    constructor() {
        super();
        this.ref = '';
        this.valueAttr = '';
    }

    connectedCallback() {
        if (super.connectedCallback) {
            super.connectedCallback();
        }

        if (this.hasAttribute('ref')) {
            this.ref = this.getAttribute('ref');
        } else {
            throw new Error('fx-setvalue must specify a "ref" attribute');
        }
        this.valueAttr = this.getAttribute('value');
    }

    perform() {
        super.perform();
        let {value} = this;
        if (this.valueAttr !== null) {
            [value] = evaluateXPath(this.valueAttr, this.nodeset, this, this.detail);
        } else if (this.textContent !== '') {
            value = this.textContent;
        } else {
            value = '';
        }
        console.log('value', value);
        if (value.nodeType === Node.ATTRIBUTE_NODE) {
            // console.log('value', value.nodeValue);
            value = value.nodeValue;
        }
        const mi = this.getModelItem();
        this.setValue(mi, value);
        // todo: check this again - logically needsUpate should be set but makes tests fail
        //  this.needsUpdate = true;

    }

    setValue(modelItem, newVal) {
        const item = modelItem;
        if (!item) return;

        if (item.value !== newVal) {
            item.value = newVal;
            this.getModel().changed.push(modelItem);
            this.needsUpdate = true;
            AbstractAction.dataChanged = true;
            // console.log('dataChanged', AbstractAction.dataChanged);
        }/*else{
            console.log('dataChanged', AbstractAction.dataChanged);
        }*/
    }
}

if (!customElements.get('fx-setvalue')) {
    window.customElements.define('fx-setvalue', FxSetvalue);
}
