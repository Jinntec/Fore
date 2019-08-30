import {html, PolymerElement} from '../../assets/@polymer/polymer/polymer-element.js';
import { XfAbstractControl } from '../xf-abstract-control.js';
import '../../assets/@polymer/paper-input/paper-input.js';


/**
 * `xf-material-input`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 * @demo ../demo/xf-material-input.html
 */
class XfMaterialInput extends XfAbstractControl {
    static get template() {
        return html`
      <style>
        :host {
          display: inline-block;
        }
        label{
            display:block;
        }
        
        :host([type='color']){
                width: 100px;
                
                --paper-input-container-underline:{
                    border:none;
                }
        }
      </style>
      <paper-input id="input" type="[[type]]" value="{{value}}" label="[[label]]"></paper-input>
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
/*
    _updateValue(){
        if(this.type === 'checkbox'){
            this.$.input.checked = this.modelItem.value;
        }else{
            // this.$.input.value = this.modelItem.value;
        }
    }
*/

    attachListeners(){
        super.attachListeners();

        if (this.incremental) {
            console.log('incremental handler');

            this.$.input.addEventListener('keyup', function (e) {
                console.log('keyup....... ', e);
                if(this.modelItem.value !== e.target.value) {
                    this.modelItem.value = e.target.value;
                    this.dispatchValueChange();
                }
            }.bind(this));

        } else {
            this.$.input.addEventListener('blur', function (e) {
                if(this.modelItem.value !== e.target.value) {
                    this.modelItem.value = e.target.value;
                    this.dispatchValueChange();
                }
            }.bind(this));

        }
    }

    focus(){
        this.$.input.focus();
    }



}

window.customElements.define('xf-material-input', XfMaterialInput);
