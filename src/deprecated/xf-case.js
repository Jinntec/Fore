import {html, PolymerElement} from '../../assets/@polymer/polymer';


/**
 * `xf-case`
 * a container allowing to switch between xf-case elements
 *
 *
 * @customElement
 * @polymer
 */
class XfCase extends PolymerElement {
    static get template() {
        return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <slot></slot>
    `;
    }


    static get properties() {
        return{
            name: {
                type: String
            },
            label: {
                type: String
            }
        }
    }

    connectedCallback() {
        super.connectedCallback();
    }

    init() {
        console.log('### init ', this);
        console.log('### init modelItem', this.modelItem);
        if (!this.repeated) {
            super.init();
        }


    }

}

window.customElements.define('xf-case', XfCase);
