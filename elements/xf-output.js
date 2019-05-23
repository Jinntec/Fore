import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import { XfBound } from './xf-bound.js';

/**
 * `xf-output`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 */
class XfOutput extends XfBound {
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

/*
    static get properties() {
        return {
            bind: {
                type: String
            },
            value:{
                type: String,
                observer:'_updateValue',
                value:''
            },
            proxy:{
                type:Object,
                value:{}
            }

        };
    }
*/


    _updateValue(){
        this.innerHTML = this.value;
    }

}

window.customElements.define('xf-output', XfOutput);
