// import { FxAction } from './fx-action.js';
import '../fx-model.js';
import { AbstractAction } from './abstract-action.js';
import { evaluateXPathToFirstNode } from '../xpath-evaluation.js';

/**
 * `fx-replace` - replaces the node referred to with 'ref' with node referred to with 'with' attribute.
 *
 * @customElement
 */
export default class FxReplace extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      with: {
        type: String,
      },
      replaceNode: Object,
    };
  }

  constructor() {
    super();
    this.with = '';
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.with = this.getAttribute('with');
  }

  async perform() {
    super.perform();
    // console.log('replace action variables', this.inScopeVariables);
    // if (!this.nodeset) {
    //   return;
    // }
    const target = evaluateXPathToFirstNode(this.with, this.nodeset, this);
    if (!target) return;

    this.replace(this.nodeset, target);
  }

  actionPerformed() {
    this.getModel().rebuild();
    super.actionPerformed();
  }

  replace(toReplace, replaceWith) {
    if (!toReplace || !replaceWith) return; // bail out silently
    if (!toReplace.nodeName || !replaceWith.nodeName) {
      console.warn('fx-replace: one argument is not a node');
      return;
    }

    if (toReplace.nodeType === Node.ATTRIBUTE_NODE) {
      const { ownerElement } = toReplace;
      ownerElement.setAttribute(replaceWith.nodeName, replaceWith.textContent);
      ownerElement.removeAttribute(toReplace.nodeName);
    } else if (toReplace.nodeType === Node.ELEMENT_NODE) {
      const cloned = replaceWith.cloneNode(true);
      toReplace.replaceWith(cloned);
    }
    // const modelitem = this.getModelItem();
    // this.getModel().changed.push(modelitem);
    this.needsUpdate = true;
  }
}

if (!customElements.get('fx-replace')) {
  window.customElements.define('fx-replace', FxReplace);
}
