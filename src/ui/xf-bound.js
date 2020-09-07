import {LitElement, html, css} from 'lit-element';
import XfAbstractControl from "./xf-abstract-control.js";
/**
 * `xf-bound`
 * a generic wrapper for controls
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
            control:{
                type:Object
            },
            updateEvent:{
                type: String
            }
        };
    }

    constructor(){
        super();
        this.control = {};
        this.updateEvent='';
        this.value='value'; //default
    }

    render() {
        return html`
           <slot></slot>         
        `;
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
        const child = this.firstElementChild;
        console.log('firstchild ', child);
        console.log('update', this.updateEvent);
        child.value = this.value;
    }


    refresh(){
        super.refresh();
        console.log('xf-bound refresh');



        const elements = this.querySelectorAll(':scope > *');
        elements.forEach(element => {

            if (typeof element.refresh === 'function') {
                element.refresh();
            }

        });




    }


}

window.customElements.define('xf-bound', XfBound);
