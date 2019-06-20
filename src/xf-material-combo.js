import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import {XfControl} from './xf-control.js';
import '../assets/@vaadin/vaadin-combo-box/vaadin-combo-box.js';

// import { XfBound } from './xf-bound.js';

/**
 * `xf-material-combo` is a Material Design combobox.
 *
 *
 * @customElement
 * @polymer
 */
class XfMaterialCombo extends XfControl {
    static get template() {
        return html`
      <style>
        :host {
          display: inline;
        }
      </style>
      <vaadin-combo-box id="combo" label="[[label]]" clear-button-visible>
        <template>
        {{item.label}}
        </template>
      </vaadin-combo-box>
    `;
    }

    static get properties() {
        return {
            items:{
                type:String
            },
            selection:{
                type: String,
                value: 'closed'
            }
        }
    }

    init() {
        super.init();

        console.log('modelitem bindings ', this.modelItem);
        console.log('modelitem bindings ', this.items);
        console.log('modelitem mockup ', document.getElementById(this.items).data);

        if(this.selection === 'open'){
            this.$.combo.allowCustomValue = true;
        }

        this.$.combo.items = document.getElementById(this.items).data;
    }

    attachListeners() {
        super.attachListeners();

        this.$.combo.addEventListener('value-changed', function (e) {
            // console.log('value-changed....... ', e);
            this.modelItem.value = e.detail.value;
            if(this.value !== e.detail.value){
                // this line is a workaround for bug https://github.com/vaadin/vaadin-combo-box/issues/758
                this.$.combo._revertInputValueToValue();
                this.dispatchValueChange();
            }
        }.bind(this));

        if(this.selection === 'open'){
            this.$.combo.addEventListener('custom-value-set', function (e) {
                // console.log('custom value set....... ', e);
                this.modelItem.value = e.detail.value;
                if(this.value !== e.detail.value){
                    this.dispatchValueChange();
                }
            }.bind(this));
        }
    }

    /**
     * @override
     * @private
     */
    _updateValue() {
        // this.innerText = this.modelItem.value;
        this.$.combo.value = this.value;
        this.$.combo.inputElement.value = this.value;
        // *** this actually shouldn't be necessary but is to display a custom value (one that's not in the list)
        // this line is a workaround for bug https://github.com/vaadin/vaadin-combo-box/issues/758
        this.$.combo._revertInputValueToValue();

    }

    _getItemValue(value){
        return this.$.combo.value;
    }

}

window.customElements.define('xf-material-combo', XfMaterialCombo);
