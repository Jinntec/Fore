import  '../xf-model.js';
import {BoundElement} from "../BoundElement";

/**
 * `xf-abstract-control` -
 * is a general class for control elements.
 *
 * @customElement
 * @polymer
 * @appliesMixin BoundElementMixin
 */
export default class XfAbstractControl extends BoundElement {

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

/*
    render() {
        return html`
            <slot></slot>
        `;
    }
*/


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
    async refresh() {
        console.log('### XfAbstractControl.refresh on : ', this);

        await this.updateComplete;
        this.control = this.shadowRoot.querySelector('#control');

        const currentVal = this.value;
        // console.log('current val ',currentVal);
        // super.refresh();

        if(this.isNotBound()) return;

        this.evalInContext();
        if(this.isBound()){
            this.modelItem = this.getModelItem();
        }

        this.value = this.modelItem.value;

/*
        if(this.repeated){
            const rItem = this.parentNode.closest('xf-repeatitem');
            console.log('closest ref ',rItem);

            const host = rItem.host;
            console.log('host ', rItem.parentNode.host);
            const ownerRepeat = rItem.parentNode.host;
            console.log('host ', ownerRepeat.closest('xf-form'));

        }

        console.log('MODEL ', this.model);
        console.log('FORM ', this.model.parentNode);
*/


        // if(!this.closest('xf-form').ready) return; // state change event do not fire during init phase (initial refresh)
        if(!this._getForm().ready) return; // state change event do not fire during init phase (initial refresh)
        if(currentVal !== this.value){
            this.dispatchEvent(new CustomEvent('value-changed', {}));
        }

        this.handleModelItemProperties();
/*
        this.handleRequired();
        this.handleReadonly();
        this.handleValid();
        this.handleRelevant();
*/
        this.requestUpdate();
    }

    handleModelItemProperties(){
        this.handleRequired();
        this.handleReadonly();
        this.handleValid();
        this.handleRelevant();
    }

    _getForm(){
        return this.getModel().parentNode;
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

    handleRelevant(){
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
        this.control = this.shadowRoot.querySelector('#control');

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
