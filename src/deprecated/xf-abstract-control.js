import {html, PolymerElement} from '../../assets/@polymer/polymer';
import {BoundElementMixin} from './BoundElementMixin.js';

/**
 * `xf-abstract-control` -
 * is a general class for bound elements. It handles the common states of a control and attaches event-listeners.
 *
 * @customElement
 * @polymer
 * @appliesMixin BoundElementMixin
 */
export class XfAbstractControl extends BoundElementMixin(PolymerElement) {

    static get properties() {
        return {
            /**
             * the label of a control
             */
            label: {
                type: String
            },
            /**
             * an alert message as defined by corresponding xf-bind element
             */
            alert: {
                type: String,
                observer: '_updateAlert'
            },
            /**
             * Boolean saying if a control is readonly or readwrite.
             *
             * Fires template function when value changes.
             *
             * @default false
             */
            readonly: {
                type: Boolean,
                value: false,
                observer: '_updateReadonly'
            },
            /**
             * Boolean saying if a control's value is required or optional.
             *
             * Fires template function when value changes.
             *
             * @default false
             */
            required: {
                type: Boolean,
                value: false,
                observer: '_updateRequired'
            },
            /**
             * Boolean saying if a control is valid or invalid.
             *
             * Fires template function when value changes.
             *
             * @default true
             */
            valid: {
                type: Boolean,
                value: true,
                observer: '_updateValid'
            },
            /**
             * Datatype of the bound node.
             *
             * Fires template function when value changes.
             *
             * @default String
             */
            datatype: {
                type: String,
                value: 'String',
                observer: '_updateDatatype'
            },
            /**
             * the value of the bound node. If the `value` changes the `_updateValue' will dispatch
             * a 'value-changed' event to itself.
             *
             * Fires template function when value changes.
             *
             */
            value: {
                type: String,
                observer: '_updateValue'
            },
            /**
             * Boolean saying if a control updates it's model value immediately or on blur.
             *
             * @default false
             */
            incremental: {
                type: Boolean,
                value: false
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        // console.log('### XfControl connected ', this);
    }

    /**
     * init is called by xf-form when component is newly setup. It applies the states for a bound element and calls
     * template function to attach eventlisteners to a specific controls. As these events depend on the type of control
     * this method needs to be implemented by extenders of `AbstractFormControl`.
     */
    init() {
        console.log('### init ', this);
        console.log('### init modelItem', this.modelItem);
        if (!this.repeated) {
            super.init();
        }
        this.applyProperties();
        this.attachListeners();

    }

    /**
     * (re)apply all state properties to this control.
     */
    refresh() {
        // console.log('### XfControl.refresh on : ', this);
        // this.modelItem = modelItem;
        this.applyProperties();
    }


    /**
     * Will check for existence of state properties in modelItem and apply them
     * to the control as appropriate.
     */
    applyProperties() {
        // console.log('XfControl.applyProperties ', this.modelItem);

        if (this.modelItem === undefined) {
            console.warn('no modelItem present for ', this);
        }

        if (this.modelItem.alert !== undefined) {
            // console.log('XfControl.applyProperties alert: ', this.modelItem.alert);
            this.alert = this.modelItem.alert;
        }
        if (this.modelItem.isReadonly !== undefined) {
            // console.log('XfControl.applyProperties readonly: ', this.modelItem.isReadonly);
            this.readonly = this.modelItem.isReadonly;
        }
        if (this.modelItem.isRequired !== undefined) {
            // console.log('XfControl.applyProperties required: ', this.modelItem.isRequired);
            this.required = this.modelItem.isRequired;
        }
        if (this.modelItem.isRelevant !== undefined) {
            // console.log('XfControl.applyProperties relevant: ', this.modelItem.isRelevant);
            this.relevant = this.modelItem.isRelevant;
        }
        if (this.modelItem.isRequired !== undefined) {
            // console.log('XfControl.applyProperties valid: ', this.modelItem.isRequired);
            this.valid = this.modelItem.isRequired;
        }
        if (this.modelItem.type !== undefined) {
            // console.log('XfControl.applyProperties type: ', this.modelItem.type);
            this.datatype = this.modelItem.type;
        }
        if (this.modelItem.value !== undefined && this.modelItem.value !== this.value) {
            // console.log('XfControl.applyProperties value: ', this.modelItem.value);
            this.value = this.modelItem.value;
        }

    }

    /**
     * attaches eventlisteners that update the uiState after user-interaction.
     *
     * As this varies between controls the respective control must override this.
     *
     * @abstract must be overridden
     */
    attachListeners() {
    }

    /**
     * dispatches a 'value-changed' event to itself.
     */
    dispatchValueChange() {
        console.log('### dispatching value change from ', this);
        const path = this.ownerForm.resolveBinding(this);
        this.dispatchEvent(new CustomEvent(
            'value-changed',
            {
                composed: true,
                bubbles: true,
                detail: {'modelItem': this.modelItem, "path":path,"target":this}
            }));
    }

    _updateAlert() {
    }

    _updateReadonly() {
    }

    _updateRequired() {
    }

    _updateValid() {
    }

    _updateDatatype() {
    }

    _updateValue() {
        // console.log('### xf-control._updateValue ', this.value);
        // this.modelItem.value = this.value;
    }
}

window.customElements.define('xf-abstract-control', XfAbstractControl);
