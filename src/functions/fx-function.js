import ForeElementMixin from '../ForeElementMixin.js';
import registerFunction from './registerFunction.js';

/**
 * Allows to extend a form with local custom functions.
 */
export class FxFunction extends ForeElementMixin {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.style.display = 'none';

    this.signature = this.hasAttribute('signature') ? this.getAttribute('signature') : null;
    this.type = this.hasAttribute('type') ? this.getAttribute('type') : null;
    this.shadowRoot.innerHTML = '<slot></slot>';

    this.override = this.hasAttribute('override') ? this.getAttribute('override') : 'true';
    this.functionBody = this.innerText;

    registerFunction(this, this);
  }
}
if (!customElements.get('fx-function')) {
  customElements.define('fx-function', FxFunction);
}
