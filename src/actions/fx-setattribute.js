// import { FxAction } from './fx-action.js';
import '../fx-model.js';
import { AbstractAction } from './abstract-action.js';
import { evaluateXPathToString } from '../xpath-evaluation.js';
import { Fore } from '../fore.js';
import getInScopeContext from '../getInScopeContext';

/**
 * `fx-setattribute` allows to create and set an attribute value in the data.
 *
 * @customElement
 */
export default class FxSetattribute extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      ref: {
        type: String,
      },
      attrName: {
        type: String,
      },
      attrValue: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.ref = '';
    this.attrName = '';
    this.attrValue = '';
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
    this.attrName = this.hasAttribute('name') ? this.getAttribute('name') : null;
    this.attrValue = this.hasAttribute('value') ? this.getAttribute('value') : '';
    if (!this.attrName) {
      Fore.dispatch('this', 'error', { message: 'name or value not specified' });
    }
  }

  async perform() {
    super.perform();
    const mi = this.getModelItem();
    if (mi.node.nodeType !== Node.ELEMENT_NODE) {
      Fore.dispatch('this', 'error', { message: 'referenced item is not an element' });
      return;
    }
    mi.node.setAttribute(this.attrName, this.attrValue);
    this.needsUpdate = true;
  }
}

if (!customElements.get('fx-setattribute')) {
  window.customElements.define('fx-setattribute', FxSetattribute);
}
