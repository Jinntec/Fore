import {html,css} from "lit-element";
import '../assets/@polymer/paper-input/paper-input.js';
import '../assets/@polymer/paper-checkbox/paper-checkbox.js';
import fx from '../output/fontoxpath.js';
import evaluateXPathToBoolean from '../output/fontoxpath.js';
import evaluateXPathToString from '../output/fontoxpath.js';
import evaluateXPathToFirstNode from '../output/fontoxpath.js';
import evaluateXPathToNodes from '../output/fontoxpath.js';
import evaluateXPath from '../output/fontoxpath.js';
import {BoundElement} from "./BoundElement";

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
            label:{
                type: String
            },
            value:{
                type: String
            }
        };
    }

    constructor(){
        super();
        this.type = 'text';
        this.label='';
        this.value='';
    }


    render() {
        return html`
            ${this.type === 'text' || this.type === 'date' ?
                html`<paper-input id="input" label="${this.label}" .value="${this.value}" type="${this.type}" @input="${this._handleInput}"></paper-input>` :''}
            
            ${this.type === 'checkbox' ?
            html`<paper-checkbox label="${this.label}" ?checked="${this.value === 'true'}"></paper-checkbox>` :''}
        `;
    }


    refresh() {
        super.refresh();
        this.value = this.getValue();
    }

    _handleInput(e) {
        const mi = this.getModelItem();
        console.log('modelItem ', mi);

        const inputValue = this.shadowRoot.querySelector('#input').value;

        console.log('refnode ', mi.refnode);
        //todo: probably modelitem should have a getter instead
        this.setValue(mi.refnode,inputValue);

        // console.log(this.model.instances[0].getInstanceData());
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
