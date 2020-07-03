import {html, PolymerElement} from '../../assets/@polymer/polymer';
import '../../assets/@polymer/iron-ajax/iron-ajax.js';
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
                 handle-as="XML"
                 method="GET"
                 on-response="_handleResource">
      </iron-ajax>
      <slot></slot>
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
        super.init();
        this._loadResource()
    }

    _loadResource(){
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
        const resp = this.$.resourceLoader.lastResponse;
        console.log('### xf-control._handleResource ', resp);


        const divElem = document.createElement("div");
        divElem.innerHTML = resp;

        console.log('target ',divElem);
        console.log('target ',divElem.firstElementChild);
        const target = divElem.querySelector('.control');
        console.log('target ',target);

        this.appendChild(divElem.firstElementChild);




    }



}

window.customElements.define('xf-control', XfControl);
