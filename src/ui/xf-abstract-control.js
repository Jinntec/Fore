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
        console.log('firstUpdated ', this);
        this.control = this.shadowRoot.querySelector('#control');
    }

    /**
     * (re)apply all state properties to this control.
     */
    refresh() {
        console.log('### XfAbstractControl.refresh on : ', this);

        const currentVal = this.value;
        console.log('current val ',currentVal);
        super.refresh();

        const mi = this.getModelItem();
        if(mi === undefined) return;
        console.log('mip ', mi);


        this.value = this.getValue();


        if(!this.closest('xf-form').ready) return; // state change event do not fire during init phase (initial refresh)

        if(currentVal !== this.value){
            this.dispatchEvent(new CustomEvent('value-changed', {}));
        }

        this.handleRequired(mi);
        this.handleReadonly(mi);
        this.handleValid(mi);
        this.handleEnabled(mi);

    }

    handleRequired(mi) {
        console.log('mip required', mi.modelItem.required);
        if (this.isRequired() !== mi.modelItem.required) {
            if (mi.modelItem.required) {
                this.control.setAttribute('required','required');
                this.dispatchEvent(new CustomEvent('required', {}));
            } else {
                this.control.removeAttribute('required');
                this.dispatchEvent(new CustomEvent('optional', {}));
            }
        }
    }

    handleReadonly(mi){
        console.log('mip readonly', mi.modelItem.readonly);
        if (this.isReadonly() !== mi.modelItem.readonly) {
            if (mi.modelItem.readonly) {
                this.control.setAttribute('readonly','readonly');
                this.dispatchEvent(new CustomEvent('readonly', {}));
            }
            if(!mi.modelItem.readonly){
                this.control.removeAttribute('readonly');
                this.dispatchEvent(new CustomEvent('readwrite', {}));
            }
        }
    }

    handleValid(mi){
        console.log('mip valid', mi.modelItem.valid);
        if (this.isValid() !== mi.modelItem.valid) {
            if (mi.modelItem.valid) {
                this.dispatchEvent(new CustomEvent('valid', {}));
            } else {
                this.dispatchEvent(new CustomEvent('invalid', {}));
            }
        }
    }

    handleEnabled(mi){
        console.log('mip valid', mi.modelItem.enabled);
        if (this.isEnabled() !== mi.modelItem.enabled) {
            if (mi.modelItem.enabled) {
                this.dispatchEvent(new CustomEvent('enabled', {}));
            } else {
                this.dispatchEvent(new CustomEvent('disabled', {}));
            }
        }
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
