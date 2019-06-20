import { PolymerElement } from '../assets/@polymer/polymer/polymer-element.js';
import {html} from "../assets/@polymer/polymer/polymer-element";


/**
 * `xf-key-value-list`
 * a button triggering Fore actions
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
export class XfKeyValueList extends PolymerElement{
    static get template() {
        return html`
      <style>
        :host {
          display: none;
        }
      </style>
      <slot></slot>
    `;
    }

    static get properties() {
        return {
            list:{
                type: Object
            },
            data:{
                type: Object
            }

        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('### xf-key-value-list attached ', this.data);
        this.data = JSON.parse(this.innerText);
    }

    getData(){
        return this.data;
    }

}

window.customElements.define('xf-key-value-list', XfKeyValueList);
