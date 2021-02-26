import {css, html} from 'lit-element';
import XfAbstractControl from "./xf-abstract-control.js";
// import * as fx from "fontoxpath";
import {Fore} from "../fore.js";

/**
 * `xf-bound`
 * a generic wrapper for controls
 *
 *
 *
 * @customElement
 * @demo demo/index.html
 */
class XfBound extends XfAbstractControl {

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

        let {control} = this;
        if(!control){
            const input = document.createElement('input');
            input.setAttribute('type', 'text');
            this.appendChild(input);
            control = input;
        }

        control.addEventListener(this.updateEvent, (e) => {
            console.log('eventlistener ', this.updateEvent);

            const modelitem = this.getModelItem();
            const setval = this.shadowRoot.getElementById('setvalue');
            setval.setValue(modelitem, control[this.valueProp]);
            // console.log('updated modelitem ', modelitem);
        });

        this.inited = true;
    }

    get control(){
        const defaultSlot = this.shadowRoot.querySelector('slot:not([name])');
        const ctrl = defaultSlot.assignedElements({flatten: true})[0];
        return  ctrl;
    }

    refresh() {
        super.refresh();
        // await this.updateComplete;
        const {control} = this;
        // ### if we find a ref on control we have a 'select' control of some kind

        if(this.control.hasAttribute('ref')){
            console.log('we have a list');
            console.log('list control ', this.control);
            const tmpl = control.querySelector('template');
            console.log('select template contents', tmpl.content);
            console.log('select template ', tmpl.content);

            // ### eval nodeset for list control
            const ref = control.getAttribute('ref');
            console.log('ref of list control ', ref);
            const inscope = this._inScopeContext();
            console.log('##### inscope ', inscope);
            // const nodeset = fx.evaluateXPathToNodes(ref, inscope, null, {});

            let formElement;
            for (let anc = this; anc; anc = anc.parentNode) {
                if (anc.localName === 'xf-form') {
                    formElement = anc;
                    break;
                }
            }


            const nodeset = Fore.evaluateToNodes (ref, inscope, formElement, Fore.namespaceResolver) ;
            console.log('list nodeset ', nodeset);
        }

    }

}

window.customElements.define('xf-bound', XfBound);
