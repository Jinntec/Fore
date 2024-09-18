import XfAbstractControl from './abstract-control.js';

/**
 * @deprecated - can easily be substituted with template expression and usual <span>.
 */
export class FxHint extends XfAbstractControl {
  static get styles() {
    return `
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
    return `
      <slot></slot>
    `;
  }

  /*
  isRequired() {
    return false;
  }

  isReadonly () {
    return true;
  }
*/

  /*
  handleRequired () {}

  handleReadonly () {
    // super.handleReadonly();
  }
*/
}

if (!customElements.get('fx-hint')) {
  customElements.define('fx-hint', FxHint);
}
