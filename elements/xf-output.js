import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import { XfControl } from './xf-control.js';

// import { XfBound } from './xf-bound.js';

/**
 * `xf-output`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 */
class XfOutput extends XfControl {
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


    /**
     * @override
     * @private
     */
    _updateValue(){
        this.innerText = this.modelItem.value;
    }



}

window.customElements.define('xf-output', XfOutput);
