import XfAbstractControl from './abstract-control.js';

export class FxOutput extends XfAbstractControl {
  static get properties() {
    return {
      ...super.properties,
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    console.log('connectedCallback output', this.shadowRoot);

    const style = `
          :host {
            display: inline-block;
          }
          #widget {
            display: inline-block;
          }
          [name='label'] {
            display: inline;
          }
        `;

    const outputHtml = `
            <slot name="label"></slot>
            <slot></slot>
            <span id="widget">${this.value}</span>
        `;

    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${outputHtml}
        `;
    // this.widget = this.shadowRoot.querySelector('#widget');
    this.widget = this.getWidget();
    console.log('widget ', this.widget);

    this.addEventListener('slotchange', e => {
      console.log('slotchange ', e);
    });
  }

  getWidget() {
    const widget = this.querySelector('.widget');
    if (widget) return widget;

    return this.shadowRoot.querySelector('#widget');
  }

  async updateWidgetValue() {
    this.widget.innerHTML = this.value;
  }

  isReadonly() {
    this.readonly = true;
    return this.readonly;
  }
}

customElements.define('fx-output', FxOutput);
