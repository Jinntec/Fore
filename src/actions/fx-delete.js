import { AbstractAction } from './abstract-action.js';
import { Fore } from '../fore.js';
import { evaluateXPathToNodes } from '../xpath-evaluation.js';
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

    const fore = this.getOwnerForm();

    let parent;

    const removedNodes = [];
    if (Array.isArray(nodesToDelete)) {
      if (nodesToDelete.length === 0) {
        return;
      }
      parent = nodesToDelete[0].parentNode;

      nodesToDelete.forEach(item => {
        if (this._deleteNode(parent, item)) {
          fore.signalChangeToElement(item.localName);
          removedNodes.push(item);
        }
      });
      if (removedNodes.length) {
        fore.signalChangeToElement(parent.localName);
      }
    } else {
      parent = nodesToDelete.parentNode;
      if (this._deleteNode(parent, nodesToDelete)) {
        fore.signalChangeToElement(parent.localName);

        fore.signalChangeToElement(nodesToDelete.localName);
        removedNodes.push(nodesToDelete);
      }
    }

    if (removedNodes.length) {
      await Fore.dispatch(instance, 'deleted', {
        ref: path,
        deletedNodes: removedNodes,
        instanceId,
        parent,
        foreId: fore.id,
      });
      this.needsUpdate = true;
    }
  }

  /**
   * Delete a node (if allowed). Does not hold for JSON
   *
   * @param {ParentNode}  parent - The parent of the node to remove
   * @param {ChildNode}   node   - The child to remove
   *
   * @returns {boolean} Whether the delete is allowed and succeeded
   */
  _deleteNode(parent, node) {
    if (
      parent.nodeType === Node.DOCUMENT_NODE ||
      node.nodeType === Node.DOCUMENT_NODE ||
      node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ||
      node.parentNode === null
    ) {
      return false;
    }

    const mi = this.getModel().getModelItem(node);
    // Note that the model item can be absent, For elements that had no controls on them.
    // In that case, allow removals
    if (mi?.readonly) {
      return false;
    }

    parent.removeChild(node);

    this.getModel().removeModelItem(node);

    return true;
  }
}

if (!customElements.get('fx-delete')) {
  window.customElements.define('fx-delete', FxDelete);
}
