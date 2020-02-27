import {html,css} from "lit-element";
import {BoundElement} from "./BoundElement";
import '../assets/@polymer/paper-input/paper-input.js';
import '../assets/@polymer/paper-checkbox/paper-checkbox.js';
import fx from "../output/fontoxpath";


import evaluateUpdatingExpression from '../output/fontoxpath.js';
import executePendingUpdateList from '../output/fontoxpath.js';

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
                html`<paper-input label="${this.label}" .value="${this.value}" type="${this.type}" @input="${this._handleInput}"></paper-input>` :''}
            
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

    _handleInput(e){
        console.log('update context: ', this.context);
        console.log('update context: ', e);
        console.log('update model: ', document.querySelector('xf-model'));

        const model = document.querySelector('xf-model');

        console.log('default data: ', model.getDefaultInstanceData());

        // this.context.setAttribute('complete','bar');
        // this.context.textContent = 'foobar';
        // console.log('update context: ', this.context);
        fx.evaluateUpdatingExpression('replace node ' + this.ref + ' with "bla"', this.context)
            .then(result => {
                fx.executePendingUpdateList(result.pendingUpdateList);
                console.log(this.model);
                // Outputs: "<foo/>"
            });
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
