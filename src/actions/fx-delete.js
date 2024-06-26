import * as fx from 'fontoxpath';
import { AbstractAction } from './abstract-action.js';
import { Fore } from '../fore.js';
import { evaluateXPathToNodes, evaluateXPathToString } from '../xpath-evaluation.js';
import { XPathUtil } from '../xpath-util.js';
import getInScopeContext from '../getInScopeContext.js';

/**
 * `fx-delete`
 * deletes nodes from instance data.
 *
 * @fires deleted event
 * @customElement
 * @demo demo/todo.html
 */
class FxDelete extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      ref: {
        type: String,
      },
    };
  }

  /**
   * deletes nodes from instance data.
   *
   * Will NOT perform delete if nodeset is pointing to document node, document fragment, root node or being readonly.
   */
  async perform() {
    const inscopeContext = getInScopeContext(this.getAttributeNode('ref') || this, this.ref);
    this.nodeset = evaluateXPathToNodes(this.ref, inscopeContext, this);

    // console.log('delete nodeset ', this.nodeset);

    const instanceId = XPathUtil.resolveInstance(this, this.ref);
    const instance = this.getModel().getInstance(instanceId);

    // const path = instance && this.nodeset.length !== 0 ? evaluateXPathToString('path()', this.nodeset[0], instance) : '';

    const path = Fore.getDomNodeIndexString(this.nodeset);

    const nodesToDelete = this.nodeset;

    this.dispatchEvent(
      new CustomEvent('execute-action', {
        composed: true,
        bubbles: true,
        cancelable: true,
        detail: { action: this, event: this.event, path },
      }),
    );

    let parent;
    if (Array.isArray(nodesToDelete)) {
      if (nodesToDelete.length === 0) return;
      parent = nodesToDelete[0].parentNode;
      nodesToDelete.forEach(item => {
        this._deleteNode(parent, item);
      });
    } else {
      parent = nodesToDelete.parentNode;
      this._deleteNode(parent, nodesToDelete);
    }

    await Fore.dispatch(instance, 'deleted', { ref: path, deletedNodes: nodesToDelete });
    this.needsUpdate = true;
  }

  _deleteNode(parent, node) {
    if (parent.nodeType === Node.DOCUMENT_NODE) return;
    if (node.nodeType === Node.DOCUMENT_NODE) return;
    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) return;
    if (node.parentNode === null) return;

    const mi = this.getModelItem();
    if (mi.readonly) return;

    parent.removeChild(node);
  }

  /**
   * overwriting as we need to perform additional rebuild()
   */
  actionPerformed() {
    this.getModel().rebuild();
    super.actionPerformed();
  }
}

if (!customElements.get('fx-delete')) {
  window.customElements.define('fx-delete', FxDelete);
}
