import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-output`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 */
class XfOutput extends PolymerElement {
    static get template() {
        return html`
      <style>
        :host {
          display: inline;
        }
      </style>
      <span id="output">
        <slot></slot>
      </span>
    `;
    }

    static get properties() {
        return {
            bind: {
                type: String
            },
            value:{
                type: String,
                observer:'_updateValue',
                value:''
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        // console.log('xf-output has value prop ', XfOutput.prototype.hasOwnProperty('value'));
    }

    refresh(bind) {
        console.log('refreshing xf-output ', bind);

        if (bind.value) {
            this.innerHTML = bind.value;
        }

    }

    _updateValue(){
        this.innerHTML = this.value;
    }

}

window.customElements.define('xf-output', XfOutput);
