import AbstractControl from './abstract-control.js';
import ADI from './adi.js';

export class FxDomInspector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render(){
      const style = `
        :host {
          display:block;
        }
      `;

      const html = `
        <slot></slot>
      `;

      this.shadowRoot.innerHTML = `
          <style>
              ${style}
          </style>
          ${html}
      `;

	  this.adiInstance = new ADI();
  }
}
if (!customElements.get('fx-dom-inspector')) {
  customElements.define('fx-dom-inspector', FxDomInspector);
}
