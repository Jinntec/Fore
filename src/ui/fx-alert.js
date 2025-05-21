import AbstractControl from './abstract-control.js';

export class FxAlert extends AbstractControl {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        super.connectedCallback();
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
