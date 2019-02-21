import {html, PolymerElement} from '../node_modules/@polymer/polymer/polymer-element.js';

/**
 * `seed-element`
 * 
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class SeedElement extends PolymerElement {
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
        value: 'seed-element',
      },
    };
  }
}

window.customElements.define('seed-element', SeedElement);
