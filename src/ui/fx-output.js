import XfAbstractControl from './abstract-control.js';

/**
 * todo: review placing of value. should probably work with value attribute and not allow slotted content.
 */
export class FxOutput extends XfAbstractControl {
  static get properties() {
    return {
      ...super.properties,
      valueAttr:{
        type:String
      }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.valueAttr = this.hasAttribute('value') ? this.getAttribute('value') : null;
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
          .label{
            display: inline-block;
          }
        `;

    const outputHtml = `
            <slot name="label"></slot>
            <span id="value">
                <slot></slot>
            </span>
        `;

    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${outputHtml}
        `;
    // this.widget = this.shadowRoot.querySelector('#widget');
    // this.widget = this.getWidget();
    // console.log('widget ', this.widget);

    this.addEventListener('slotchange', e => {
      console.log('slotchange ', e);
    });
  }

  async refresh () {
    // ### 1. eval 'value' attr

    if(this.valueAttr){
      this.value = this.getValue();
      await this.updateWidgetValue();
      return;
    }
    // ### 2. eval 'ref' attr
    if(this.ref){
      super.refresh();
    }
    // ### 3. use inline content which is there anyway
  }

  getWidget() {
    const valueWrapper = this.shadowRoot.getElementById('value');
    return valueWrapper;
  }

  async updateWidgetValue() {
    const valueWrapper = this.shadowRoot.getElementById('value');
    valueWrapper.innerHTML = this.value;
  }

  isReadonly() {
    this.readonly = true;
    return this.readonly;
  }
}

customElements.define('fx-output', FxOutput);
