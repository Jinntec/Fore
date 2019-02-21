import {html, PolymerElement} from '../../node_modules/@polymer/polymer/polymer-element.js';

/**
 * `xf-bound`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class XfBound extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <h2>Hello [[prop1]]!</h2>
    `;
  }
  static get properties() {
    return {
      prop1: {
        type: String,
        value: 'fore-form',
      },
    };
  }
}

window.customElements.define('xf-bound', XfBound);
