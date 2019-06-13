import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import { BoundElementMixin } from './BoundElementMixin.js';

/**
 * `xf-control`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 * @appliesMixin BoundElementMixin
 * @demo demo/index.html
 */
export class XfControl extends BoundElementMixin(PolymerElement) {

    static get properties() {
        return {
            alert: {
                type: String,
                observer:'_updateAlert'
            },
            readonly: {
                type: Boolean,
                value: false,
                observer:'_updateReadonly'
            },
            required: {
                type: Boolean,
                value: false,
                observer:'_updateRequired'
            },
            relevant: {
                type: Boolean,
                value: true,
                observer:'_updateRelevant'
            },
            valid: {
                type: Boolean,
                value: true,
                observer:'_updateValid'
            },
            datatype: {
                type: String,
                value: 'String',
                observer:'_updateDatatype'
            },
            value: {
                type: String,
                observer:'_updateValue'
            },
            incremental:{
                type: Boolean,
                value: false
            }
        };
    }

    init(){
        if(!this.repeated){
            super.init();
        }
        this.applyProperties();
        this.attachListeners();

    }

    refresh() {
        console.log('init with modelItem: ', this.modelItem);
        // this.modelItem = modelItem;
        this.applyProperties();
    }


    applyProperties() {
        console.log('XfControl.applyProperties ', this.modelItem);
        console.log('XfControl.applyProperties ', this.modelItem.value);
        console.log('XfControl.applyProperties id: ', this.modelItem.id);
        console.log('XfControl.applyProperties required: ', this.modelItem.required);

        if (this.modelItem.alert !== undefined) {
            // console.log('apply alert prop ', this.uiState.alert);
            //todo
        }
        if (this.modelItem.readonly !== undefined) {
            // console.log('apply readonly prop ', this.uiState.readonly);
            this.readonly = this.modelItem.readonly;
        }
        if (this.modelItem.required !== undefined) {
            // console.log('apply required prop ', this.uiState.required);
            this.required = this.modelItem.required;
        }
        if (this.modelItem.relevant !== undefined) {
            // console.log('apply relevant prop ', this.uiState.relevant);
            this.relevant = this.modelItem.relevant;
        }
        if (this.modelItem.valid !== undefined) {
            // console.log('apply valid prop ', this.uiState.valid);
            this.valid = this.modelItem.valid;
        }
        if (this.modelItem.type !== undefined) {
            // console.log('apply type prop ', this.uiState.type);
            this.datatype = this.modelItem.type;
        }
        if (this.modelItem.value !== undefined) {
            this.value = this.modelItem.value;
        }

    }

    /**
     * attaches eventlisteners that update the uiState after user-interaction.
     *
     * As this varies between controls the respective control must override this.
     *
     * @private
     */
    attachListeners() {}

    dispatchValueChange(){
        console.log('### dispatching value change from ', this);
        this.dispatchEvent(new CustomEvent('value-changed', {composed: true, bubbles: true, detail: {}}));
    }

    _updateAlert(){}

    _updateReadonly(){}

    _updateRequired(){}

    _updateRelevant(){}

    _updateValid(){}

    _updateDatatype(){}

    _updateValue(){
        // console.log('### xf-control._updateValue ', this.value);
        // this.uiState.value = this.value;
    }
}

window.customElements.define('xf-control', XfControl);
