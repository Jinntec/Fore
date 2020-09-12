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
            ...super.properties,
            value:{
                type: String
            },
            control:{
                type:Object
            }
        };
    }

    constructor(){
        super();
        this.value = "";
        this.control = {};
    }

    firstUpdated(_changedProperties) {
        // console.log('firstUpdated ', this);
        this.control = this.shadowRoot.querySelector('#control');
    }



    /**
     * (re)apply all state properties to this control.
     */
    refresh() {
        console.log('### XfAbstractControl.refresh on : ', this);

        const currentVal = this.value;
        console.log('current val ',currentVal);
        // super.refresh();

        if(this.isNotBound()) return;

        this.value = this.modelItem.value;

        if(!this.closest('xf-form').ready) return; // state change event do not fire during init phase (initial refresh)
        if(currentVal !== this.value){
            this.dispatchEvent(new CustomEvent('value-changed', {}));
        }

        this.handleRequired();
        this.handleReadonly();
        this.handleValid();
        this.handleEnabled();
        this.requestUpdate();
    }

    handleRequired() {
        // console.log('mip required', this.modelItem.required);
        if (this.isRequired() !== this.modelItem.required) {
            if (this.modelItem.required) {
                this.control.setAttribute('required','required');
                this.dispatchEvent(new CustomEvent('required', {}));
            } else {
                this.control.removeAttribute('required');
                this.dispatchEvent(new CustomEvent('optional', {}));
            }
        }
    }

    handleReadonly(){
        // console.log('mip readonly', this.modelItem.readonly);
        if (this.isReadonly() !== this.modelItem.readonly) {
            if (this.modelItem.readonly) {
                this.control.setAttribute('readonly','readonly');
                this.dispatchEvent(new CustomEvent('readonly', {}));
            }
            if(!this.modelItem.readonly){
                this.control.removeAttribute('readonly');
                this.dispatchEvent(new CustomEvent('readwrite', {}));
            }
        }
    }

    handleValid(){
        // console.log('mip valid', this.modelItem.valid);
        if (this.isValid() !== this.modelItem.valid) {
            if (this.modelItem.valid) {
                this.dispatchEvent(new CustomEvent('valid', {}));
            } else {
                this.dispatchEvent(new CustomEvent('invalid', {}));
            }
        }
    }

    handleEnabled(){
        // console.log('mip valid', this.modelItem.enabled);
        if (this.isEnabled() !== this.modelItem.enabled) {
            if (this.modelItem.enabled) {
                this.dispatchEvent(new CustomEvent('enabled', {}));
            } else {
                this.dispatchEvent(new CustomEvent('disabled', {}));
            }
        }
    }



/*
    setValue(node, newVal) {

        const m = this.getModelItem();
        m.value =
        // m.setNodeValue(newVal);

        if (node.nodeType === node.ATTRIBUTE_NODE) {
            node.nodeValue = newVal;
        } else {
            node.textContent = newVal;
        }

    }
*/


/*
    getValue() {
        // console.log('getValue nodeset ', this.nodeset);
        if (this.nodeset.nodeType === Node.ELEMENT_NODE) {
            return this.nodeset.textContent;
        }
        return this.nodeset;
        // return this.getModelItem().modelItem.value;
    }
*/

    getControlValue(){};


    isRequired(){
        // if(this.control.required){
        if(this.control.hasAttribute('required')){
            return true;
        }
        return false;
    }

    isValid(){
        if(this.control.valid){
            return true;
        }
        return false;
    }

    isReadonly(){
        if(this.control.hasAttribute('readonly')){
            return true;
        }
        return false;
    }

    isEnabled(){
        if(this.control.style.display === 'none'){
            return false;
        }
        return true;
    }



}

window.customElements.define('xf-abstract-control', XfAbstractControl);
