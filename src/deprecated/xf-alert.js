import {html, PolymerElement} from '../../assets/@polymer/polymer';
import '../../assets/@polymer/paper-styles/color.js';


/**
 * `xf-alert`
 * displays an validation error
 *
 *  * todo: implement
 * @customElement
 * @polymer
 */
export class XfAlert extends PolymerElement{
    static get template() {
        return html`
      <style>
        :host {
          display: block;
          font-size: 12px;
          color:var(--paper-red-500);
          padding: 2px 0;
        }
      </style>
      <slot></slot>
    `;
    }


    connectedCallback() {
        super.connectedCallback();
    }

    show(){
        this.hidden = false;
    }

}

window.customElements.define('xf-alert', XfAlert);
