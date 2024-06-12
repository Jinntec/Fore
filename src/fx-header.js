import ForeElementMixin from "./ForeElementMixin.js";

export class FxHeader extends ForeElementMixin {
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
if (!customElements.get('fx-header')) {
  customElements.define('fx-header', FxHeader);
}
