// import { FxAction } from './fx-action.js';
import '../fx-model.js';
import { AbstractAction } from './abstract-action.js';
import { evaluateXPath } from '../xpath-evaluation.js';
import { Fore } from '../fore.js';

/**
 * `fx-setvalue`
 *
 * @customElement
 */
export default class FxSetvalue extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      ref: {
        type: String,
      },
      valueAttr: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.ref = '';
    this.valueAttr = '';
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }

    if (this.hasAttribute('ref')) {
      this.ref = this.getAttribute('ref');
    } else {
      throw new Error('fx-setvalue must specify a "ref" attribute');
    }
    this.valueAttr = this.getAttribute('value');
  }

  async perform() {
    super.perform();
    let { value } = this;
    if (this.valueAttr !== null) {
      [value] = evaluateXPath(this.valueAttr, this.nodeset, this, this.detail);
    } else if (this.textContent !== '') {
      value = this.textContent;
    } else {
      value = '';
    }
    if (value?.nodeType && value.nodeType === Node.ATTRIBUTE_NODE) {
      value = value.nodeValue;
    }
    const mi = this.getModelItem();
    this.setValue(mi, value);
    // todo: check this again - logically needsUpate should be set but makes tests fail
    //  this.needsUpdate = true;
  }

  /**
   * need to overwrite default dispatchExecute to do it ourselves. This is necessary for tracking control value changes
   * which call setvalue directly without perform().
   */
  dispatchExecute() {}

  setValue(modelItem, newVal) {
    const item = modelItem;
    if (!item) return;

    if (item.value !== newVal) {
      // const path = XPathUtil.getPath(modelItem.node);
      const path = Fore.getDomNodeIndexString(modelItem.node);

      const ev = this.event;
      const targetElem = this;
      this.dispatchEvent(
        new CustomEvent('execute-action', {
          composed: true,
          bubbles: true,
          cancelable: true,
          detail: {
            action: targetElem,
            event: ev,
            value: newVal,
            path,
          },
        }),
      );

      if (newVal?.nodeType) {
        if (newVal.nodeType === Node.ELEMENT_NODE) {
          item.value = newVal.textContent;
        }
        if (newVal.nodeType === Node.ATTRIBUTE_NODE) {
          item.value = newVal.getValue();
        }
      } else {
        item.value = newVal;
      }
      this.getModel().changed.push(modelItem);
      this.needsUpdate = true;
    }
  }
}

if (!customElements.get('fx-setvalue')) {
  window.customElements.define('fx-setvalue', FxSetvalue);
}
