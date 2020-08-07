import {html,css} from "lit-element";
import '../../assets/@polymer/paper-input/paper-input.js';
import '../../assets/@polymer/paper-checkbox/paper-checkbox.js';
import XfAbstractControl from "./xf-abstract-control.js";
import XfSetvalue from "../actions/xf-setvalue.js";
import "../xf-model.js";

/**
 * `xf-input`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 */
class XfInput extends XfAbstractControl{


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
            type:{
                type: String
            },
            label:{
                type: String
            },
            value:{
                type: String
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
        // this.modelItem={};
    }


    render() {
        return html`
            ${this.type === 'text' || this.type === 'date' ?
                html`<paper-input id="control" 
                                  label="${this.label}"
                                  .value="${this.value}"
                                  type="${this.type}"
                                  @input="${this._handleInput}"></paper-input>` :''}
            
            ${this.type === 'checkbox' ?
                html`<paper-checkbox id="control" label="${this.label}" ?checked="${this.value === 'true'}"></paper-checkbox>` :''}
        `;
    }



    refresh() {
        super.refresh();
        // console.log('------ this ', this);
        // console.log('------ nodeset ', this.nodeset);
        // console.log('------ modelItem ', this.getModelItem());
        // console.log('------- required', this.getModelItem().modelItem.required);
        // this.required = this.getModelItem().modelItem.required;
        // this.valid = this.getModelItem().modelItem.valid;
        // this.value = this.getValue();
        // this.value = this.getModelItem().modelItem.value;
        // this.value = this.getValue();
        this.requestUpdate();
    }

    _handleInput(e) {
        const mi = this.getModelItem();
        // console.log('modelItem ', mi);

        const inputValue = this.shadowRoot.querySelector('#control').value;

        // console.log('_handleInput refnode ', mi.refnode);

        // const setVal = new XfSetvalue();
        // setVal.setValue(this.nodeset,inputValue);

        // this.setValue(mi.refnode,inputValue);

        // mi.value = inputValue;
        new XfSetvalue().setValue(mi,this.value);


        // console.log(this.model.instances[0].getInstanceData());
        this.model.updateModel();
        document.querySelector('xf-form').refresh();



        console.log('instanceData ', this.model.instances[0].getInstanceData());

    }

/*
    /!**
     * @override
     * @private
     *!/

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
*/

    focus(){
        this.$.input.focus();
    }

    _updateAlert() {

    }


}

window.customElements.define('xf-input', XfInput);
