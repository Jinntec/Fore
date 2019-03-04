import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';

/**
 * `xf-repeat`
 * an xformish form for eXist-db
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class XfRepeat extends PolymerElement {
    static get template() {
        return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <template id="template">
          <slot></slot>
      </template>
    `;
    }

    static get properties() {
        return {
            bind:{
                type:String
            }
        };
    }


    connectedCallback() {
        super.connectedCallback();
        // console.log('xf-repeat connected ', this);
        // const $bindings = this.querySelectorAll('[bind]');
        // console.log('repeat binds ', $bindings);
        // console.log('repeat data ', this.data[0].todo);
        // console.log('repeat data ', this.data['todo']);
/*
        const tmpl = this.shadowRoot.querySelector('template');
        console.log('repeat template ', tmpl);
        console.log('repeat content ', tmpl.content);
        const content = document.importNode(tmpl.content, true);
        this.appendChild(content);
*/


    }

    _attachDom(dom) {
        this.appendChild(dom);
    }

}

window.customElements.define('xf-repeat', XfRepeat);
