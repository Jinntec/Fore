import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import {BoundElementMixin} from './BoundElementMixin.js';
import '../assets/@polymer/iron-ajax/iron-ajax.js';

/**
 * `xf-control` allows to embed one form into another.
 *
 * todo: implementation and demo
 *
 * @customElement
 * @polymer
 * @appliesMixin BoundElementMixin
 * @demo demo/index.html
 */
export class XfControl extends BoundElementMixin(PolymerElement) {
    static get template() {
        return html`
      <style>
        :host {
          display: inline-block;
        }
      </style>
      <iron-ajax id="resourceLoader"
                 url="[[resource]]"
                 method="GET"
                 handle-as="document"
                 on-response="_handleResource">
      </iron-ajax>
    `;
    }

    static get properties() {
        return {
            resource: {
                type: String
            },
            initial: {
                type: String
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('### XfControl.connectedCallback ', this);
        this.$.resourceLoader.generateRequest();
    }

    _handleResource(){
        console.log('### xf-control._handleResource ', this.$.resourceLoader.lastResponse);
        //todo
    }


}

window.customElements.define('xf-control', XfControl);
