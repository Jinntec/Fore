import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import { XfJsonData } from './xf-json-data.js';
import '../assets/@polymer/iron-ajax/iron-ajax.js';


/**
 * `xf-items`
 * holds some JSON data that needs to follow this format:
 * ```
 * [
 *      {"label":"aLabel","value":"aValue"}
 * ]
 * ```
 *
 * This element is used by combobox or listbox controls to build a list of options.
 *
 * @customElement
 * @polymer
 * @demo demo/xf-items.html
 */
class XfItems extends XfJsonData {
    static get template() {
        return html`
          <style>
            :host {
              display: none;
            }
          </style>
          <slot></slot>
           <iron-ajax id="itemsLoader"
                 method="GET"
                 handle-as="json"
                 on-response="_handleResource"
                 on-error="_handleError">
          </iron-ajax>

        `;
    }

    static get properties() {
        return {
            url: {
                type: String
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        if(this.url){
            console.log('### load items from URL: ', this.url);
            this.$.itemsLoader.url = this.url;
            this.$.itemsLoader.generateRequest();
        }


    }

    _handleResource(){
        console.log('### resource loaded ', this.$.itemsLoader.lastResponse);
    }

    _handleError(){
        const status = this.$.itemsLoader.lastError.statusText;
        console.error('### resource loading failed: ', this, status);
        this.dispatchEvent(new CustomEvent('resource-error', {composed: true, bubbles: true, detail: {"element":this,"status":status}}));
    }

}

window.customElements.define('xf-items', XfItems);
