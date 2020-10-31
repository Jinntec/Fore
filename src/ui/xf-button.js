import {LitElement, html, css} from 'lit-element';
import '../../assets/@polymer/paper-button';
import XfAbstractControl from "./xf-abstract-control.js";
/**
 * `xf-button`
 * a button triggering Fore actions
 *
 * @customElement
 * @demo demo/index.html
 */
class XfButton extends XfAbstractControl {

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
            label:{
                type: String
            }
        };
    }

    constructor(){
        super();
        this.label = '';
    }

    render() {
        return html`
           <paper-button @click="${this.performActions}" raised>${this.label}</paper-button>
           <slot></slot>         
        `;
    }

    performActions() {
        console.log('performActions ', this.children);

        const repeatedItem = this.closest('xf-repeatitem');
        if(repeatedItem){
            console.log('repeated click');
            repeatedItem.click();
        }
        for (let i = 0; i < this.children.length; i++) {
            // console.log('child ', this.children[i]);
            const child = this.children[i];

            if(typeof child.execute === 'function' ){
                child.execute();
            }else{
                console.warn('child has no "execute" function ', child);
                return false;
            }
        }

        // ### signal to form that action-block is complete and changes should be send
        this.dispatchEvent(new CustomEvent(
            'actions-performed',
            {
                composed: true,
                bubbles: true,
                detail: {}
            }));

        return true;

    }

    refresh(){
        super.refresh();
        // console.log('xf-button refresh');

        const elements = this.querySelectorAll(':scope > *');
        elements.forEach(element => {

            if (typeof element.refresh === 'function') {
                element.refresh();
            }

        });




    }


}

window.customElements.define('xf-button', XfButton);
