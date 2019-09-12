import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-dialog`
 * displays a dialog
 *
 *
 * todo: implement
 *
 * @customElement
 * @polymer
 */
export class XfDialog extends PolymerElement{
    static get template() {
        return html`
      <style>
        :host {
          display: inline-block;
        }
      </style>
      <slot></slot>
    `;
    }


    connectedCallback() {
        super.connectedCallback();
    }

    show(){
    }

    hide(){
    }

}

window.customElements.define('xf-dialog', XfDialog);
