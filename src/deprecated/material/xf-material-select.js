import {html, PolymerElement} from '../../../assets/@polymer/polymer';
import {XfAbstractControl} from '../xf-abstract-control.js';
import '../../../assets/@vaadin/vaadin-combo-box';
import '../../assets/@vaadin/vaadin-list-box/vaadin-list-box.js';
import '../../assets/@vaadin/vaadin-item/vaadin-item.js';

// import { XfBound } from './xf-bound.js';

/**
 * `xf-material-select` is a Material Design select control.
 *
 *
 * @customElement
 * @polymer
 * @demo ../demo/xf-material-select.html
 */
class XfMaterialSelect extends XfAbstractControl {
    static get template() {
        return html`
      <style>
        :host {
          display: inline;
        }
      </style>
      <vaadin-combo-box id="combo" label="[[label]]" clear-button-visible>
        <template>
            <vaadin-item label="[[item.label]]">[[item.value]]</vaadin-item>
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

        console.log('selection ', this.selection);

        if(this.selection === 'open'){
            this.$.combo.allowCustomValue = true;
        }else{
            this.$.combo.allowCustomValue = false;
            this.$.combo.clearButtonVisible = false;
        }


        if(this.itemset){
            console.log('itemset ', this.itemset);
            console.log('itemset data ', document.getElementById(this.itemset).data);
            this.$.combo.items = document.getElementById(this.itemset).data;
        } else {
            // look for options

            const options = this.querySelectorAll('option');
            const items = [];
            for(let i=0;i<options.length;i++){
                console.log('option ', options[i]);
                const val = options[i].getAttribute('value');
                const lbl = options[i].textContent;
                items.push({"label":lbl,"value":val})
            }

            console.log('inline items ', items);
            this.$.combo.items = items;
        }

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

window.customElements.define('xf-material-select', XfMaterialSelect);
