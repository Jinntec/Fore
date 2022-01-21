import XfAbstractControl from './abstract-control.js';
import { evaluateXPath, evaluateXPathToString } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
// import {markdown} from '../drawdown.js';

/**
 * todo: review placing of value. should probably work with value attribute and not allow slotted content.
 */
export class FxOutput extends XfAbstractControl {
  static get properties() {
    return {
      ...super.properties,
      valueAttr: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.valueAttr = this.hasAttribute('value') ? this.getAttribute('value') : null;
  }

  connectedCallback() {
    const style = `
          @import 'fx-output-styles.css';
          :host {
            display: inline-block;
          }
          #widget {
            display: inline-block;
          }
          .label{
            display: inline-block;
          }
          table,tbody{
            width:100%;
          }
          th{
            text-align:left;
          }
          td{
            padding-right:1rem;
          }
        `;

    const outputHtml = `
            <slot name="label"></slot>
            <span id="value">
                <slot id="main"></slot>
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
    this.mediatype = this.hasAttribute('mediatype')?this.getAttribute('mediatype'):null;

    this.addEventListener('slotchange', e => {
      console.log('slotchange ', e);
    });
  }

  async refresh() {
    // ### 1. eval 'value' attr
    // await super.refresh();

    if (this.valueAttr) {
      this.value = this.getValue();
      await this.updateWidgetValue();
      return;
    }
    // ### 2. eval 'ref' attr
    if (this.ref) {
      super.refresh();
    }
    // ### 3. use inline content which is there anyway
  }

  getValue() {
    // return 'foobar';
    try {
      const inscopeContext = getInScopeContext(this, this.valueAttr);
      if (this.hasAttribute('html')) {
        return evaluateXPath(this.valueAttr, inscopeContext, this);
      }
      return evaluateXPathToString(this.valueAttr, inscopeContext, this);
    } catch (error) {
      console.error(error);
      this.dispatch('error', { message: error });
    }
    return null;
  }

  getWidget() {
    const valueWrapper = this.shadowRoot.getElementById('value');
    return valueWrapper;
  }

  async updateWidgetValue() {
    console.log('updateWidgetValue')
    const valueWrapper = this.shadowRoot.getElementById('value');

    if(this.mediatype === 'markdown'){
      const md = markdown(this.nodeset);
      this.innerHtml = md;
    }

    if (this.mediatype === 'html') {
      if (this.modelItem.node) {
/*
        valueWrapper.innerHTML = this.modelItem.node.outerHTML;
        return;
*/

        const node = this.modelItem.node;

        if(node.nodeType){
          // const mainSlot = this.shadowRoot.querySelector('#main');
          // valueWrapper.appendChild(node);

          // todo: checking if ownerDocument of node and ownerDocument of this are the same - otherwise import first
          // const imported = this.ownerDocument.importNode(node,true);
          // const clone = node.cloneNode(true);

          this.appendChild(node);
          // this.innerHtml = node;
          // this.innerHTML = node;
          return;
        }
        Object.entries(node).map(obj => {
          // valueWrapper.appendChild(obj[1]);
          this.appendChild(obj[1]);
        });
        return;
      }

      // this.innerHTML = this.value.outerHTML;
      valueWrapper.innerHTML = this.value.outerHTML;

      // this.shadowRoot.appendChild(this.value);
      return;
    }

    valueWrapper.innerHTML = this.value;
  }

  isReadonly() {
    this.readonly = true;
    return this.readonly;
  }
}

customElements.define('fx-output', FxOutput);
