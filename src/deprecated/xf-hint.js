import {html, PolymerElement} from '../../assets/@polymer/polymer';
import '../../assets/@polymer/paper-styles/color.js';


/**
 * `xf-hint`
 * displays a hint for a control
 *
 *
 *  * todo: implement
 * @customElement
 * @polymer
 */
export class XfHint extends PolymerElement{
    static get template() {
        return html`
      <style>
        :host {
          display: inline-block;
          font-style: italic;
          font-size: 12px;
          color:var(--paper-grey-700);
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

window.customElements.define('xf-hint', XfHint);
