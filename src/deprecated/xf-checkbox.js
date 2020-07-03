import {html, PolymerElement} from '../../assets/@polymer/polymer';
import { XfAbstractControl } from './xf-abstract-control.js';
import '../../assets/@polymer/paper-checkbox';
import './deprecated/xf-alert.js';

// import { XfBound } from './xf-bound.js';

/**
 * `xf-input`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 */
class XfCheckbox extends XfAbstractControl {
    static get template() {
        return html`

      <custom-style>
          <style is="custom-style">
                paper-checkbox .title {
                  display: block;
                  font-size: 1.2em;
                }
          </style>
      </custom-style>
      <style>
        :host {
          display: inline-block;
        }
        label{
        display:block;
        }
        .alert{
            color:
        }
        

      </style>
      <paper-checkbox id="checkbox">
          <span class="title">[[label]]</span>
      </paper-checkbox>
    `;
    }

    static get properties() {
        return {
            type:{
                type: String,
                value: 'text'
            }
        };
    }

    /**
     * @override
     * @private
     */
    _updateValue(){
        this.$.checkbox.checked = this.modelItem.value;
    }


    attachListeners(){
        super.attachListeners();

        this.$.checkbox.addEventListener('change', function (e) {
            if(this.modelItem.value !== e.target.checked) {
                this.modelItem.value = e.target.checked;
                this.dispatchValueChange();
            }
        }.bind(this));

    }

    focus(){
        this.$.input.focus();
    }

    _updateAlert() {

    }


}

window.customElements.define('xf-checkbox', XfCheckbox);
