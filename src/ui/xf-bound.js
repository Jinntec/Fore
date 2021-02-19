import {css, html} from 'lit-element';
import XfAbstractControl from "./xf-abstract-control.js";

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
        :host ::slotted(*){
            width:100%;
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
        this.updateEvent='blur';
        this.valueProp='value'; // default
        this.inited = false;
    }

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
        // console.log('firstUpdated ', _changedProperties);
        super.firstUpdated(_changedProperties);
        // console.log('updateEvent', this.updateEvent);

        if(!this.control){
            const input = document.createElement('input');
            input.setAttribute('type', 'text');
            this.appendChild(input);
        }

        this.control.addEventListener(this.updateEvent, (e) => {
            console.log('eventlistener ', this.updateEvent);

            const modelitem = this.getModelItem();
            const setval = this.shadowRoot.getElementById('setvalue');
            // setval.setValue(modelitem, control[this.valueProp]);

            setval.setValue(modelitem, this.control[this.valueProp]);
            // console.log('updated modelitem ', modelitem);
        });
        this.inited = true;
    }

    get control(){
        const defaultSlot = this.shadowRoot.querySelector('slot:not([name])');
        return defaultSlot.assignedElements({flatten: true})[0];
    }

}

window.customElements.define('xf-bound', XfBound);
