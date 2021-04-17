import { html, css } from 'lit-element';

import XfAbstractControl from './abstract-control.js';

/**
 * todo
 */
export class FxItems extends XfAbstractControl {
  static get styles() {
    return css`
      :host {
        display: block;
        height: auto;
        font-size: 0.8em;
        font-weight: 400;
        font-style: italic;
      }
    `;
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
}
customElements.define('fx-items', FxItems);
