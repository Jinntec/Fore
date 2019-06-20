import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-json-data`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 */
class XfJsonData extends PolymerElement {
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

    connectedCallback() {
        super.connectedCallback();
        const inner = this.innerText;
        this.data = JSON.parse(inner);
        console.log('### XfJsonData.connectedCallback ', this);
        console.log('### XfJsonData.connectedCallback ', this.getData());

    }

    getData(){
        return this.data;
    }

}

window.customElements.define('xf-json-data', XfJsonData);
