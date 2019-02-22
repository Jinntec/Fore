import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import '../assets/@polymer/iron-ajax/iron-ajax.js';

/**
 * `fore-form`
 * an xformish form for eXist-db
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class XfForm extends PolymerElement {
    static get template() {
        return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <iron-ajax id="initForm" 
                 url="/exist/apps/fore/init"
                 handle-as="json" 
                 method="GET"
                 ></iron-ajax>
       <slot></slot>
       <div>hello world</div>
    `;
    }

    static get properties() {
        return {
            token: {
                type: String
            },
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('xf-form connected ', this);
        this.$.initForm.params = {"token": this.token};
        this.$.initForm.generateRequest();

    }
}
window.customElements.define('xf-form', XfForm);
