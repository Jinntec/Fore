import AbstractControl from './abstract-control.js';

export class FxAlert extends AbstractControl {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const style = `
      :host {
        height: auto;
        font-size: 0.8em;
        font-weight: 400;
        color: red;
        display: none;
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

  }

  async updateWidgetValue() {
    console.log('alert update', this);
    this.innerHTML = this.value;
  }
}
customElements.define('fx-alert', FxAlert);
