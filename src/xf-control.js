import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import {BoundElementMixin} from './BoundElementMixin.js';

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
            label:{
                type: String
            },
            alert: {
                type: String,
                observer: '_updateAlert'
            },
            readonly: {
                type: Boolean,
                value: false,
                observer: '_updateReadonly'
            },
            required: {
                type: Boolean,
                value: false,
                observer: '_updateRequired'
            },
            relevant: {
                type: Boolean,
                value: true,
                observer: '_updateRelevant'
            },
            valid: {
                type: Boolean,
                value: true,
                observer: '_updateValid'
            },
            datatype: {
                type: String,
                value: 'String',
                observer: '_updateDatatype'
            },
            value: {
                type: String,
                observer: '_updateValue'
            },
            incremental: {
                type: Boolean,
                value: false
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('### XfControl.connectedCallback ', this);

    }

    init() {
        console.log('### init ', this);
        if (!this.repeated) {
            super.init();
        }
        this.applyProperties();
        this.attachListeners();

    }

    refresh() {
        console.log('### XfControl.refresh on : ', this);
        // this.modelItem = modelItem;
        this.applyProperties();
    }


    applyProperties() {
        console.log('XfControl.applyProperties ', this.modelItem);

        if (this.modelItem.alert !== undefined) {
            // console.log('XfControl.applyProperties alert: ', this.modelItem.alert);
            //todo
        }
        if (this.modelItem.readonly !== undefined) {
            // console.log('XfControl.applyProperties readonly: ', this.modelItem.readonly);
            this.readonly = this.modelItem.readonly;
        }
        if (this.modelItem.required !== undefined) {
            // console.log('XfControl.applyProperties required: ', this.modelItem.required);
            this.required = this.modelItem.required;
        }
        if (this.modelItem.relevant !== undefined) {
            // console.log('XfControl.applyProperties relevant: ', this.modelItem.relevant);
            this.relevant = this.modelItem.relevant;
        }
        if (this.modelItem.valid !== undefined) {
            // console.log('XfControl.applyProperties valid: ', this.modelItem.valid);
            this.valid = this.modelItem.valid;
        }
        if (this.modelItem.type !== undefined) {
            // console.log('XfControl.applyProperties type: ', this.modelItem.type);
            this.datatype = this.modelItem.type;
        }
        if (this.modelItem.value !== undefined) {
            // console.log('XfControl.applyProperties value: ', this.modelItem.value);
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
    attachListeners() {
    }

    dispatchValueChange() {
        console.log('### dispatching value change from ', this);
        this.dispatchEvent(new CustomEvent('value-changed', {composed: true, bubbles: true, detail: {}}));
    }

    _updateAlert() {
    }

    _updateReadonly() {
    }

    _updateRequired() {
    }

    _updateRelevant() {
    }

    _updateValid() {
    }

    _updateDatatype() {
    }

    _updateValue() {
        // console.log('### xf-control._updateValue ', this.value);
        // this.uiState.value = this.value;
    }
}

window.customElements.define('xf-control', XfControl);
