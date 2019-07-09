import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import '../assets/@polymer/iron-ajax/iron-ajax.js';
import {XfAbstractControl} from "./xf-abstract-control";

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
export class XfControl extends XfAbstractControl {
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
        console.log('### XfControl connected ', this);
        console.log('### XfControl connected ', this.resource);

    }

    init() {
        if (this.resource) {
            this.$.resourceLoader.generateRequest();
        } else {
            console.log('### no resource specified');
            this.dispatchEvent(new CustomEvent('no-control-resource', {
                composed: true, bubbles: true,
                detail: {
                    'id': this.id
                }
            }));
        }

    }

    _handleResource() {
        console.log('### xf-control._handleResource ', this.$.resourceLoader.lastResponse);
        //todo
    }


}

window.customElements.define('xf-control', XfControl);
