import {html,css} from "lit-element";
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import XfAbstractControl from "./fx-abstract-control.js";
import "../actions/fx-setvalue.js";
import "../fx-model.js";

/**
 * `fx-input`
 * general class for bound elements
 *
 * @customElement
 */
class FxInput extends XfAbstractControl{


    static get styles() {
        return css`
        :host {
          display: inline-block;
        }
        paper-input{
            display:inline-block;
        }
        label{
            display:block;
        }
        .alert{
            color:
        }
        `;
    }

    static get properties() {
        return {
            ... super.properties,
            type:{
                type: String
            },
            label:{
                type: String
            },
            value:{
                type: String,
                attribute:'value',
                reflect:true
            },
            required:{
                type:Boolean,
                reflect:true
            }

        };
    }

    constructor(){
        super();
        this.type = 'text';
        this.label='';
        this.value='';
        this.required = false;
        this.valid = true;
    }


    render() {
        return html`
            ${this.type === 'text' || this.type === 'date' ?
                html`
                    <slot></slot>
                    <paper-input id="control" 
                                  label="${this.label}"
                                  .value="${this.value}"
                                  type="${this.type}"
                                  ?required="${this.required}"
                                  ?this.readonly="${this.readonly}"
                                  @input="${this._handleInput}">
                    </paper-input>
                    <fx-setvalue id="setvalue" ref="${this.ref}" value="${this.value}"></fx-setvalue>
                    ` :''}
            
            ${this.type === 'checkbox' ?
                html`<paper-checkbox id="control" label="${this.label}" ?checked="${this.value === 'true'}"></paper-checkbox>` :''}
        `;
    }

    _handleInput(e) {
        // const mi = this.getmdelItem();
        console.log('_handleInput ', this.modelItem);
        // console.log('modelItem ', mi);

        const inputValue = this.shadowRoot.querySelector('#control').value;

        const setval = this.shadowRoot.querySelector('#setvalue');
        setval.model = this.getModel();
        setval.setValue(this.modelItem, inputValue);

        console.log('instanceData ', this.getModel().instances[0].getInstanceData());

    }

    getControl(){
        return this.shadowRoot.getElementById('control');
    }

    // updateControlValue(){
    //     console.log('_updateControlValue fx-input');
    //     this.shadowRoot.getElementById('control').value = this.value;
    // }

}

window.customElements.define('fx-input', FxInput);
