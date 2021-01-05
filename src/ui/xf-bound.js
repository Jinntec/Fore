import {LitElement, html, css} from 'lit-element';
import XfAbstractControl from "./xf-abstract-control.js";
import {foreElementMixin} from "../ForeElementMixin.js";

/**
 * `xf-bound`
 * a generic wrapper for controls
 *
 * @customElement
 * @demo demo/index.html
 */
class XfBound  extends XfAbstractControl {


    static get styles() {
        return css`
        :host {
          display: inline-block;
        }
        `;
    }

    static get properties() {
        return {
            ...super.properties,
            updateEvent:{
                type: String,
                attribute:'update-event'
            },
            valueProp:{
                type:String,
                attribute:'value-prop'
            }
        };
    }

    constructor(){
        super();
        this.control = {};
        this.updateEvent='';
        this.valueProp='value'; //default
        this.inited = false;
    }

/*
    connectedCallback(){
        this.ref = this.getAttribute('ref');
        this.updateEvent = this.getAttribute('update-event');
        this.valueProp = this.getAttribute('value-prop');
    }
*/

    render() {
        return html`
           <slot name="alert"></slot>
           <slot name="label"></slot>
           <slot></slot>    
           <slot name="hint"></slot>    
           <xf-setvalue id="setvalue" ref="${this.ref}"></xf-setvalue>
        `;
    }

    firstUpdated(_changedProperties) {
        console.log('firstUpdated ', _changedProperties);
        super.firstUpdated(_changedProperties);
        console.log('updateEvent', this.updateEvent);
        this._init();
    }

    _init () {
        const slots = this.shadowRoot.querySelectorAll('slot');
        slots.forEach(slot => {
            if (!slot.hasAttribute('name')) {

                const control = slot.assignedElements({flatten: true})[0];
                this.control = control;
                control.addEventListener(this.updateEvent, (e) => {
                    console.log('eventlistener ', this.updateEvent);

                    const modelitem = this.getModelItem();
                    const setval = this.shadowRoot.getElementById('setvalue');
                    setval.setValue(modelitem, control[this.valueProp]);
                    // console.log('updated modelitem ', modelitem);
                });
            }
        });
        this.inited = true;
    }

    get control(){
        const defaultSlot = this.shadowRoot.querySelector('slot:not([name])');
        return defaultSlot.assignedElements({flatten: true})[0];
    }

    set control(control){
    }

/*
    updated(changedProperties){
        console.log('updated ', changedProperties);
        changedProperties.forEach((oldValue, propName) => {
            console.log(`${propName} changed. oldValue: ${oldValue}`);
        });
    }
*/

/*
    shouldUpdate(changedProperties){
        // super.shouldUpdate(changedProperties);
        console.log('shouldUpdate ', changedProperties);
        return this.getModel().inited;
    }
*/

     refresh(){
        // console.log('xf-bound refresh');

        console.log('valueProp ', this.valueProp);

        const defaultSlot = this.shadowRoot.querySelector('slot:not([name])');
        const control = defaultSlot.assignedElements()[0]; // there must be just
        this.control = control;

        // await this.updateComplete;
        super.refresh();
        control[this.valueProp] = this.modelItem.value;

    }

    handleRequired() {
        super.handleRequired();
        // this.control
    }

}

window.customElements.define('xf-bound', XfBound);
