import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import { XfAbstractControl } from './xf-abstract-control.js';

// import { XfBound } from './xf-bound.js';

/**
 * `xf-input`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 */
class XfInput extends XfAbstractControl {
    static get template() {
        return html`
      <style>
        :host {
          display: inline-block;
        }
        label{
        display:block;
        }
      </style>
      <label for="input">[[label]]</label>
      <input id="input" type="[[type]]" value="{{value}}">
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
        if(this.type === 'checkbox'){
            this.$.input.checked = this.modelItem.value;
        }else{
            this.$.input.value = this.modelItem.value;
        }
    }

    attachListeners(){
        super.attachListeners();

        if (this.incremental) {
            console.log('incremental handler');

            this.$.input.addEventListener('keyup', function (e) {
                console.log('keyup....... ', e);
                this.modelItem.value = e.target.value;
                this.dispatchValueChange();
            }.bind(this));

        } else {
            this.$.input.addEventListener('blur', function (e) {
                this.modelItem.value = e.target.value;
                this.dispatchValueChange();
            }.bind(this));

        }
    }

    focus(){
        this.$.input.focus();
    }



}

window.customElements.define('xf-input', XfInput);
