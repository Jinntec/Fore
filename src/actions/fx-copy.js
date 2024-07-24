import '../fx-model.js';
import { AbstractAction } from './abstract-action.js';

/**
 * `fx-copy`
 * todo: demo + tests
 * @customElement
 */
export default class FxCopy extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      ref: {
        type: String,
      },
      to: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.ref = '';
    this.to = '';
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }

    if (this.hasAttribute('ref')) {
      this.ref = this.getAttribute('ref');
    } else {
      throw new Error('fx-copy must specify a "ref" attribute');
    }
    this.to = this.getAttribute('to');
  }

  perform() {
    super.perform();

    if (this.nodeset.nodeType === Node.ATTRIBUTE_NODE) {
      navigator.clipboard.writeText(this.nodeset.nodeValue);
    } else {
      navigator.clipboard.writeText(this.nodeset);
    }
  }

  /*
    setValue(modelItem, newVal) {
        const item = modelItem;
        if (!item) return;

        if (item.value !== newVal) {
            item.value = newVal;
            this.getModel().changed.push(modelItem);
            this.needsUpdate = true;
        }
    }
*/
}

if (!customElements.get('fx-copy')) {
  window.customElements.define('fx-copy', FxCopy);
}
