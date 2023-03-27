import {AbstractAction} from './abstract-action.js';
import {Fore} from '../fore.js';
import {evaluateXPathToNodes} from "../xpath-evaluation.js";
import {XPathUtil} from "../xpath-util";
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
    constructor() {
        super();
    }

    /**
     * deletes nodes from instance data.
     *
     * Will NOT perform delete if nodeset is pointing to document node, document fragment, root node or being readonly.
     */
    async perform() {
        this.dispatchEvent(
            new CustomEvent('execute-action', {
                composed: true,
                bubbles: true,
                cancelable:true,
                detail: { action: this, event:this.event},
            }),
        );

        console.log('##### fx-delete executing...');
        const inscopeContext = getInScopeContext(this.getAttributeNode('ref') || this, this.ref);
        this.nodeset = evaluateXPathToNodes(this.ref, inscopeContext, this);

        console.log('delete nodeset ', this.nodeset);

        const nodesToDelete = this.nodeset;
        let parent;
        if (Array.isArray(nodesToDelete)) {
            if(nodesToDelete.length === 0) return;
            parent = nodesToDelete[0].parentNode;
            nodesToDelete.forEach(item => {
                this._deleteNode(parent, item);
            });
        } else {
            parent = nodesToDelete.parentNode;
            this._deleteNode(parent, nodesToDelete);
        }

        const instanceId = XPathUtil.resolveInstance(this);
        const instance = this.getModel().getInstance(instanceId);
        Fore.dispatch(instance, 'deleted', {deletedNodes:nodesToDelete});
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
