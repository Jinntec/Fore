import {LitElement, html, css} from 'lit-element';

import  '../fx-model.js';
import {Fore} from "../fore.js";
import {foreElementMixin} from "../ForeElementMixin.js";

/**
 * `fx-container` -
 * is a general class for container elements.
 *
 * @customElement
 */
// export class FxContainer extends BoundElement {
export class FxContainer extends foreElementMixin(LitElement) {

/*
    static get properties() {
        return {
            ...super.properties,
        };
    }

*/
/*
    render() {
        return html`
            <slot></slot>
        `;
    }
*/


    constructor(){
        super();
    }

/*
    firstUpdated(_changedProperties) {
        // console.log('firstUpdated ', this);
        this.control = this.shadowRoot.querySelector('#control');
    }
*/



    /**
     * (re)apply all state properties to this control.
     */
    refresh() {
        console.log('### FxContainer.refresh on : ', this);

        if(this.isBound()){
            this.evalInContext();
            this.modelItem = this.getModelItem();
            this.value = this.modelItem.value;
        }

        // await this.updateComplete;

        // state change event do not fire during init phase (initial refresh)
        if(this._getForm().ready) {
            this.handleModelItemProperties();
        }
        // this.requestUpdate();

        Fore.refreshChildren(this);
    }

    handleModelItemProperties(){
        this.handleReadonly();
        this.handleRelevant();
    }

    _getForm(){
        return this.getModel().parentNode;
    }


    handleReadonly(){
        // console.log('mip readonly', this.modelItem.isReadonly);
        if (this.isReadonly() !== this.modelItem.readonly) {
            if (this.modelItem.readonly) {
                this.setAttribute('readonly','readonly');
                this.dispatchEvent(new CustomEvent('readonly', {}));
            }
            if(!this.modelItem.readonly){
                this.removeAttribute('readonly');
                this.dispatchEvent(new CustomEvent('readwrite', {}));
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



    isReadonly(){
        if(this.hasAttribute('readonly')){
            return true;
        }
        return false;
    }

    isEnabled(){
        if(this.style.display === 'none'){
            return false;
        }
        return true;
    }



}

window.customElements.define('fx-container', FxContainer);
