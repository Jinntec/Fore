import XfAbstractControl from './abstract-control.js';
import { evaluateXPath, evaluateXPathToString } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';

/**
 * todo: review placing of value. should probably work with value attribute and not allow slotted content.
 */
export class FxCheckboxGroup extends XfAbstractControl {
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
          :host , .fx-checkbox-group{
            display: inline-block;
          }
          #widget {
            display: inline-block;
          }
          .label{
            display: inline-block;
          }
        `;

    const html = `
        <div class="fx-checkbox-group widget">
            <slot></slot>
        </div>
    `;


    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        ${html}
    `;


    this.widget = this.shadowRoot.querySelector('widget');
    this.addEventListener('slotchange', e => {
      console.log('slotchange ', e);
    });


  }


  async refresh() {
    super.refresh();
    const tmpl = this.querySelector('template');
    const itemsAttr = this.getAttribute('items');
    const inscope = getInScopeContext(this, itemsAttr);
    const formElement = this.closest('fx-fore');
    const items = evaluateXPath(itemsAttr, inscope, this);

    // ### clear items
    const { children } = this;
    Array.from(children).forEach(child => {
      if (child.nodeName.toLowerCase() !== 'template') {
        child.parentNode.removeChild(child);
      }
    });
    // ### build the items
    if (items.length) {
      // console.log('items', items);
      Array.from(items).forEach(node => {
        // console.log('#### node', node);
        this._createEntry(tmpl);

        // ### initialize new entry
        // ### set value
        // this.updateEntry(newEntry, node, formElement);
      });
    } else {
      const newEntry = this._createEntry(tmpl);
      this._updateEntry(newEntry, items, formElement);
    }

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
    return this.shadowRoot.querySelector('.widget');
  }

  async updateWidgetValue() {
    const valueWrapper = this.shadowRoot.getElementById('value');

/*
    if (this.hasAttribute('html')) {
      if (this.modelItem.node) {
        valueWrapper.innerHTML = this.modelItem.node.outerHTML;
        return;
      }

      // this.innerHTML = this.value.outerHTML;
      valueWrapper.innerHTML = this.value.outerHTML;

      // this.shadowRoot.appendChild(this.value);
      return;
    }

    valueWrapper.innerHTML = this.value;
*/
  }

  isReadonly() {
    this.readonly = true;
    return this.readonly;
  }

  _createEntry(tmpl) {
    const content = tmpl.content.firstElementChild.cloneNode(true);
    const newEntry = document.importNode(content, true);
    console.log('newEntry ', newEntry);

    // update label
    const label =

    this.appendChild(newEntry);
    // this.appendChild(this._addCheckbox('foo','bar','baz'));


    // return newEntry;
  }

  _updateEntry(newEntry, node, formElement) {
    const valueAttribute = this._getValueAttribute(newEntry);
    const valueExpr = valueAttribute.value;
    const cutted = valueExpr.substring(1, valueExpr.length - 1);
    const evaluated = evaluateXPath(cutted, node, newEntry);
    valueAttribute.value = evaluated;

    if (this.value === evaluated) {
      newEntry.setAttribute('selected', 'selected');
    }

    // ### set label
    const optionLabel = newEntry.textContent;
    const labelExpr = optionLabel.substring(1, optionLabel.length - 1);

    const label = evaluateXPathToString(labelExpr, node, newEntry);
    newEntry.textContent = label;
    //  ### <<< needs rework
  }


}

customElements.define('fx-checkbox-group', FxCheckboxGroup);
