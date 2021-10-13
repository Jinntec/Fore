import { foreElementMixin } from './ForeElementMixin.js';

export class FxHeader extends foreElementMixin(HTMLElement) {
  constructor() {
    super();
    this.style.display = 'none';
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = ``;

    if (!this.hasAttribute('name')) {
      throw new Error('required attribute "name" missing');
    }
    this.name = this.getAttribute('name');
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = ``;
  }
}
customElements.define('fx-header', FxHeader);
