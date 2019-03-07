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
/*
    static get template() {
        return html`
      <style>
        :host {
          display: block;
        }
        #repeatTmpl{
            
        }
      </style>
      <template id="repeatTmpl">
        <slot></slot>
      </template>
    `;
    }
*/

    static get properties() {
        return {
            bind:{
                type:String
            }
        };
    }


    connectedCallback() {
        super.connectedCallback();
        console.log('xf-repeat connected ', this);

        // console.log('this content aka template ', this.firstElementChild);

        const tmpl = this.firstElementChild;
        console.log('template for repeat ', tmpl);

        const clone = document.importNode(tmpl.content, true);
        this.appendChild(clone);


    }

    // _attachDom(dom) {
    //     this.appendChild(dom);
    // }

}

window.customElements.define('xf-repeat', XfRepeat);
