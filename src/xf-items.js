import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
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
class XfItems extends PolymerElement {
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
            /**
             * the url to load the JSON key/value list from
             */
            url: {
                type: String
            },
            /**
             * array of key/value objects
             */
            data:{
                type: Array,
                value:[]
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        if(this.url){
            console.log('### load items from URL: ', this.url);
            this.$.itemsLoader.url = this.url;
            this.$.itemsLoader.generateRequest();
        }else{
            this.data = JSON.parse(this.textContent);
            console.log('### inline data loaded ', this.data);

        }
    }

    _handleResource(){
        this.data = JSON.parse(this.$.itemsLoader.lastResponse);
        console.log('### resource loaded ', this.data);
    }

    _handleError(){
        const status = this.$.itemsLoader.lastError.statusText;
        console.error('### resource loading failed: ', this, status);
        this.dispatchEvent(new CustomEvent('resource-error', {composed: true, bubbles: true, detail: {"element":this,"status":status}}));
    }

}

window.customElements.define('xf-items', XfItems);
