import XfAbstractControl from './abstract-control.js';
import '@vanillawc/wc-codemirror/index.js';
import '@vanillawc/wc-codemirror/mode/xml/xml.js';

export class FxCode extends XfAbstractControl {
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
            <slot></slot>
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
    this.widget.setValue(this.modelItem.node.outerHTML);
    this.widget.editor.refresh();
  }

  isReadonly() {
    this.readonly = true;
    return this.readonly;
  }
}

customElements.define('fx-code', FxCode);
