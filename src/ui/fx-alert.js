import AbstractControl from './abstract-control.js';

export class FxAlert extends AbstractControl {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Inline field errors are announced politely by default so tabbing through several invalid
    // fields does not interrupt the screen reader. Use `politeness="assertive"` for urgent alerts.
    const assertive = this.getAttribute('politeness') === 'assertive';
    this.setAttribute('role', assertive ? 'alert' : 'status');
    this.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
    this.setAttribute('aria-atomic', 'true');

    const style = `
      :host {
        height: auto;
        font-size: 0.8em;
        font-weight: 400;
        color: red;
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

  getWidget() {
    return this;
  }

  async updateWidgetValue() {
    this.innerHTML = this.value;
  }
}
if (!customElements.get('fx-alert')) {
  customElements.define('fx-alert', FxAlert);
}
