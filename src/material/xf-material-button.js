import {html, PolymerElement} from '../../assets/@polymer/polymer/polymer-element.js';
import { XfButton } from '../native/xf-button.js';
import '../../assets/@polymer/paper-button/paper-button.js';

/**
 * `xf-material-button`
 * a button triggering Fore actions
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class XfMaterialButton extends XfButton {
    static get template() {
        return html`
      <style>
        :host {
          display: inline-block;
        }
        .label{
            display:inline-block;
            padding:4px;
        }
        button{
          background:inherit;
        }
      </style>
      <paper-button id="button" on-click="performActions" raised$="[[raised]]" toggles$="[[toggles]]">
        <span class="label">[[label]]</span>
        <slot></slot>
      </paper-button>
    `;
    }

    static get properties() {
        return {
            raised: {
                type: Boolean,
                value:false
            },
            toggles:{
                type:Boolean,
                value:false
            }
        };
    }



}

window.customElements.define('xf-material-button', XfMaterialButton);
