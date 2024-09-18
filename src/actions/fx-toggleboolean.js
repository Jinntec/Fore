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
export default class FxToggleboolean extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      ref: {
        type: String,
      },
      valueAttr: {
        type: String,
      },
      value: {
        type: Boolean,
      },
    };
  }

  constructor() {
    super();
    this.ref = '';
    this.valueAttr = '';
    this.value = false;
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }

    if (this.hasAttribute('ref')) {
      this.ref = this.getAttribute('ref');
    } else {
      throw new Error('fx-togglealue must specify a "ref" attribute');
    }
  }

  async perform() {
    super.perform();
    const mi = this.getModelItem();
    mi.value === 'true' ? (mi.node.textContent = 'false') : (mi.node.textContent = 'true');
    this.needsUpdate = true;
  }
}

if (!customElements.get('fx-toggleboolean')) {
  window.customElements.define('fx-toggleboolean', FxToggleboolean);
}
