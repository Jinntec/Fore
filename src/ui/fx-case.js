// import { foreElementMixin } from '../ForeElementMixin';

/**
 * `fx-case`
 * a container allowing to switch between fx-case elements
 *
 *  * todo: implement
 * @customElement
 */
class FxCase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (this.hasAttribute('label')) {
      this.label = this.getAttribute('label');
    }
    if (this.hasAttribute('name')) {
      this.name = this.getAttribute('name');
    }
    if (this.hasAttribute('selected')) {
      this.selected = this.getAttribute('selected');
    }

    const style = `
            :host {
                display: none;
            }
        `;
    const html = `
           ${this.label ? `<span>${this.label}</span>` : ''}
           <slot></slot>
        `;
    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
    `;

    this.style.display = 'none';
  }
}

window.customElements.define('fx-case', FxCase);
