import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import {XfAbstractControl} from './xf-abstract-control.js';
import '../assets/@vaadin/vaadin-combo-box/vaadin-combo-box.js';

// import { XfBound } from './xf-bound.js';

/**
 * `xf-material-combo` is a Material Design combobox.
 *
 *
 * @customElement
 * @polymer
 */
class XfMaterialCombo extends XfAbstractControl {
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
            /**
             * idref to
             */
            itemset:{
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
        console.log('modelitem bindings ', this.itemset);
        console.log('modelitem mockup ', document.getElementById(this.itemset).data);

        if(this.selection === 'open'){
            this.$.combo.allowCustomValue = true;
        }

        this.$.combo.items = document.getElementById(this.itemset).data;
    }

    attachListeners() {
        super.attachListeners();

        this.$.combo.addEventListener('value-changed', function (e) {
            // console.log('value-changed....... ', e);
            this.modelItem.value = e.detail.value;
            if(this.value !== e.detail.value){
                this.dispatchValueChange();
            }
        }.bind(this));

        if(this.selection === 'open'){
            this.$.combo.addEventListener('custom-value-set', function (e) {
                // console.log('custom value set....... ', e);
                this.modelItem.value = e.detail;
                // this.$.combo.inputElement.value = this.value;
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
        this.$.combo.value = this.value;
        // console.log('>>>>>>>>>>>>> combo label ', this.$.combo.selectedItem);

        // hack to work around issue: https://github.com/vaadin/vaadin-combo-box/issues/758
        if(this.$.combo.selectedItem){
            this.$.combo.inputElement.value = this.$.combo.selectedItem.label;
        }else{
            this.$.combo.inputElement.value = this.value;
        }
    }

/*
    _getItemValue(value){
        return this.$.combo.value;
    }
*/

}

window.customElements.define('xf-material-combo', XfMaterialCombo);
