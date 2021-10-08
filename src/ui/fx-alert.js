import { html, css } from 'lit-element';

import XfAbstractControl from './abstract-control.js';

export class FxAlert extends XfAbstractControl {
  static get styles() {
    return css`
      :host {
        display: block;
        height: auto;
        font-size: 0.8em;
        font-weight: 400;
        color: red;
        display: none;
      }
    `;
  }

  constructor() {
    super();
    this.style.display = 'none';
  }

  static get properties() {
    return {
      ...super.properties,
    };
  }

  render() {
    return html`
      <slot></slot>
    `;
  }

  async updateWidgetValue() {
    console.log('alert update', this);
    this.innerHTML = this.value;
  }

}
customElements.define('fx-alert', FxAlert);
