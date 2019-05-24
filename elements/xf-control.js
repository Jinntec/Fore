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
            }
        };
    }

    init(proxy) {
        super.init(proxy);
        console.log('init with proxy: ', proxy);
        this.proxy = proxy;
        this._applyProperties();
        this._attachListeners();
    }


    _applyProperties() {
        console.log('XfControl.applyProperties ', this.proxy);
        console.log('XfControl.applyProperties ', this.proxy.value);
        console.log('XfControl.applyProperties id', this.proxy.id);
        console.log('XfControl.applyProperties id', this.proxy.required);

        if (this.proxy.alert !== undefined) {
            // console.log('apply alert prop ', this.proxy.alert);
            //todo
        }
        if (this.proxy.readonly !== undefined) {
            // console.log('apply readonly prop ', this.proxy.readonly);
            this.readonly = this.proxy.readonly;
        }
        if (this.proxy.required !== undefined) {
            // console.log('apply required prop ', this.proxy.required);
            this.required = this.proxy.required;
        }
        if (this.proxy.relevant !== undefined) {
            // console.log('apply relevant prop ', this.proxy.relevant);
            this.relevant = this.proxy.relevant;
        }
        if (this.proxy.valid !== undefined) {
            // console.log('apply valid prop ', this.proxy.valid);
            this.valid = this.proxy.valid;
        }
        if (this.proxy.type !== undefined) {
            // console.log('apply type prop ', this.proxy.type);
            this.datatype = this.proxy.type;
        }
        if (this.proxy.value !== undefined) {
            this.value = this.proxy.value;
        }

    }

    /**
     * attaches eventlisteners that update the proxy after user-interaction.
     *
     * As this varies between controls the respective control must override this.
     *
     * @private
     */
    _attachListeners() {}

    _updateAlert(){}

    _updateReadonly(){}

    _updateRequired(){}

    _updateRelevant(){}

    _updateValid(){}

    _updateDatatype(){}

    _updateValue(){
        // console.log('### xf-control._updateValue ', this.value);
        // this.proxy.value = this.value;
    }
}

window.customElements.define('xf-control', XfControl);
