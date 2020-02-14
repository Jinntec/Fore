import {html,css} from "lit-element";
import {BoundElement} from "./BoundElement";
import '../assets/@polymer/paper-input/paper-input.js';
import '../assets/@polymer/paper-checkbox/paper-checkbox.js';
import fx from "../output/fontoxpath";

/**
 * `xf-input`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 */
class XfInput extends BoundElement {


    static get styles() {
        return css`
        :host {
          display: inline-block;
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
            context:{
                type:Object
            },
            label:{
                type: String
            }
        };
    }

    constructor(){
        super();
        this.type = 'text';
        this.context={};
        this.label='';
    }


    render() {
        return html`
            ${this.type === 'text' || this.type === 'date' ?
                html`<paper-input label="${this.label}" .value="${this.value}" type="${this.type}"></paper-input>` :''}
            
            ${this.type === 'checkbox' ?
            html`<paper-checkbox label="${this.label}" ?checked="${this.value === 'true'}"></paper-checkbox>` :''}
            
            
            
        `;
    }

    refresh() {
        // console.log('xf-input refresh');
        // console.log('xf-input refresh context ', this.context);
        // console.log('xf-input refresh context ', this.ref);

        if(this.context !== {}){
            this.value = fx.evaluateXPathToString(this.ref, this.context, null, {});
        } else {
            this.value = this.evalBinding();
        }
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

    _updateAlert() {

    }


}

window.customElements.define('xf-input', XfInput);
