import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-json-data`
 * holds some JSON data as inline content and returns them as Object.
 *
 * @customElement
 * @polymer
 */
export class XfJsonData extends PolymerElement {
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
            data:{
                type:Object
            },
            content:{
                type:Object
            }
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this.content = this.innerText;
        try{
            this.data = JSON.parse(this.content);
        } catch (e) {
            this._dispatchError();
        }
        console.log('### XfJsonData.connectedCallback ', this);
        console.log('### XfJsonData.connectedCallback ', this.getData());

    }

    getData() {
        return this.data;
    }

    _dispatchError(){
        console.error('Error while trying to parse JSON data ', this);
        this.dispatchEvent(new CustomEvent('json-parse-error', {composed: true, bubbles: true, detail: {"element":this}}));
    }

}

window.customElements.define('xf-json-data', XfJsonData);
