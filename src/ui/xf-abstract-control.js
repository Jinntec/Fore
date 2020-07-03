import {UiElement} from './UiElement.js';
import  '../xf-model.js';
/**
 * `xf-abstract-control` -
 * is a general class for control elements.
 *
 * @customElement
 * @polymer
 * @appliesMixin BoundElementMixin
 */
export default class XfAbstractControl extends UiElement {

    static get properties() {
        return {
            value:{
                type: String
            }
        };
    }


    /**
     * (re)apply all state properties to this control.
     */
/*
    refresh() {
        console.log('### XfControl.refresh on : ', this);
        super.refresh();
    }
*/

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


}

window.customElements.define('xf-abstract-control', XfAbstractControl);
