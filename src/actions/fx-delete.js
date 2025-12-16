// src/actions/fx-delete.js

import { AbstractAction } from './abstract-action.js';
import { Fore } from '../fore.js';
import { XPathUtil } from '../xpath-util.js';
import getInScopeContext from '../getInScopeContext.js';

/**
 * fx-delete
 *
 * XML: remove DOM nodes using XPath.
 * JSON: delete JSONNode(s) (node.__jsonlens__ === true) without calling FontoXPath.
 *
 * Rationale: evaluating ref="." through FontoXPath while using a JSONDomFacade can recurse
 * (eg. getParentNode / getAllAttributes / etc.) and blow the stack.
 */
class FxDelete extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      ref: { type: String },
    };
  }

  async perform() {
    const ref = (this.getAttribute('ref') || this.ref || '.').trim() || '.';

    // IMPORTANT: for JSON this must become the current JSON repeat item (JSONNode)
    // when ref="." is used inside an fx-repeat.
    const inscopeContext = getInScopeContext(this.getAttributeNode('ref') || this, ref);

    // Resolve instance from the *action element* (never from a JSONNode!)
    const instanceId = XPathUtil.resolveInstance(this, ref);
    const instance = this.getModel().getInstance(instanceId);

    const isJsonInstance =
      !!instance &&
      (instance.type === 'json' ||
        (typeof instance.getAttribute === 'function' && instance.getAttribute('type') === 'json'));

    if (isJsonInstance) {
      return this._performJsonDelete(ref, inscopeContext, instance, instanceId);
    }

    return this._performXmlDelete(ref, inscopeContext, instance, instanceId);
  }

  // -----------------
  // JSON delete branch
  // -----------------

  async _performJsonDelete(ref, inscopeContext, instance, instanceId) {
    const nodesToDelete = this._resolveJsonNodeset(ref, inscopeContext, instance);
    this.nodeset = nodesToDelete;

    const path = this._jsonNodesetPath(nodesToDelete);

    this.dispatchEvent(
      new CustomEvent('execute-action', {
        composed: true,
        bubbles: true,
        cancelable: true,
        detail: { action: this, event: this.event, path, isJson: true },
      }),
    );

    if (!nodesToDelete.length) {
      this.needsUpdate = true;
      return;
    }

    const removed = this._deleteJsonNodes(nodesToDelete);
    if (!removed.length) {
      this.needsUpdate = true;
      return;
    }

    const fore = this.getOwnerForm();

    await Fore.dispatch(instance, 'deleted', {
      ref: path,
      deletedNodes: removed,
      instanceId,
      parent: removed[0]?.parent || null,
      foreId: fore?.id,
      isJson: true,
    });

    this.needsUpdate = true;
  }

  _isJsonNode(n) {
    return !!n && n.__jsonlens__ === true;
  }

  /**
   * Resolve ref to JSONNode(s) without calling fontoxpath.
   * Supports:
   *  - '.'
   *  - '?a?b'
   *  - "instance('id')?a?b"
   *  - '?*' (returns children)
   */
  _resolveJsonNodeset(ref, inscopeContext, instance) {
    // 1) '.' means: current JSON node (repeat item) or instance root
    if (ref === '.') {
      if (this._isJsonNode(inscopeContext)) return [inscopeContext];
      if (this._isJsonNode(instance?.nodeset)) return [instance.nodeset];
      return [];
    }

    // 2) lens refs
    const parsed = this._parseJsonLensRef(ref);
    if (!parsed) return [];

    const model = this.getModel();
    const targetInstance = model?.getInstance?.(parsed.instanceId) || instance;
    const root = targetInstance?.nodeset;
    if (!this._isJsonNode(root)) return [];

    // Base:
    // - explicit instance('x') => root
    // - otherwise: relative to JSON inscope if available, else root
    let node = parsed.hasExplicitInstance
      ? root
      : this._isJsonNode(inscopeContext)
        ? inscopeContext
        : root;

    for (const step of parsed.steps) {
      if (!node) return [];
      if (step === '*') {
        return Array.isArray(node.children) ? node.children : [];
      }
      node = typeof node.get === 'function' ? node.get(step) : null;
    }

    if (!node) return [];

    // If the final node is an array container, treat its children as the nodeset.
    if (Array.isArray(node.value)) return node.children || [];

    return [node];
  }

  _parseJsonLensRef(ref, defaultInstanceId = 'default') {
    if (!ref) return null;
    const s = String(ref).trim();

    const instMatch = s.match(/^instance\s*\(\s*(['\"])(.*?)\1\s*\)\s*(\?.*)?$/);
    let instanceId;
    let lensPart;

    if (instMatch) {
      instanceId = instMatch[2];
      lensPart = instMatch[3] || '';
    } else {
      if (!s.startsWith('?')) return null;
      instanceId = defaultInstanceId;
      lensPart = s;
    }

    const steps = lensPart
      .split('?')
      .filter(Boolean)
      .map(part => {
        if (part === '*') return '*';
        if (/^\d+$/.test(part)) return Number(part) - 1; // 1-based -> 0-based
        return part;
      });

    return { instanceId, steps, hasExplicitInstance: !!instMatch };
  }

  _jsonNodesetPath(nodes) {
    const first = nodes?.[0];
    if (!first) return '';
    if (typeof first.getPath === 'function') return first.getPath();
    // fallback: behave like root
    const inst = first.instanceId || 'default';
    return `$${inst}/`;
  }

  _deleteJsonNodes(nodes) {
    const model = this.getModel();
    const removed = [];

    // Never delete root, and keep indices stable: delete array members from the end.
    const arrayNodes = [];
    const objectNodes = [];

    for (const n of nodes) {
      if (!this._isJsonNode(n)) continue;
      if (!n.parent) continue;

      const p = n.parent;
      if (Array.isArray(p.value) && typeof n.keyOrIndex === 'number') arrayNodes.push(n);
      else objectNodes.push(n);
    }

    arrayNodes.sort((a, b) => (b.keyOrIndex ?? 0) - (a.keyOrIndex ?? 0));

    const canDelete = n => {
      try {
        const mi = model?.getModelItem?.(n);
        return !mi?.readonly;
      } catch (_e) {
        return true;
      }
    };

    const rebuildUp = start => {
      let cur = start;
      while (cur) {
        if (typeof cur._buildChildren === 'function') cur._buildChildren();
        cur = cur.parent;
      }
    };

    const removeModelItem = n => {
      try {
        model?.removeModelItem?.(n);
      } catch (_e) {
        // ignore
      }
    };

    const doDelete = n => {
      if (!canDelete(n)) return;
      const p = n.parent;
      if (!p) return;

      if (Array.isArray(p.value) && typeof n.keyOrIndex === 'number') {
        p.value.splice(n.keyOrIndex, 1);
        removed.push(n);
        rebuildUp(p);
        removeModelItem(n);
        return;
      }

      if (p.value && typeof p.value === 'object' && typeof n.keyOrIndex === 'string') {
        delete p.value[n.keyOrIndex];
        removed.push(n);
        rebuildUp(p);
        removeModelItem(n);
      }
    };

    arrayNodes.forEach(doDelete);
    objectNodes.forEach(doDelete);

    return removed;
  }

  // -----------------
  // XML delete branch
  // -----------------

  async _performXmlDelete(ref, inscopeContext, instance, instanceId) {
    const { evaluateXPathToNodes } = await import('../xpath-evaluation.js');

    const nodesToDelete = evaluateXPathToNodes(ref, inscopeContext, this);
    this.nodeset = nodesToDelete;

    const path = Fore.getDomNodeIndexString(nodesToDelete);

    this.dispatchEvent(
      new CustomEvent('execute-action', {
        composed: true,
        bubbles: true,
        cancelable: true,
        detail: { action: this, event: this.event, path },
      }),
    );

    const fore = this.getOwnerForm();
    const removedNodes = [];
    let parent;

    if (Array.isArray(nodesToDelete)) {
      if (nodesToDelete.length === 0) return;
      parent = nodesToDelete[0].parentNode;
      nodesToDelete.forEach(item => {
        if (this._deleteXmlNode(parent, item)) {
          fore.signalChangeToElement(item.localName);
          removedNodes.push(item);
        }
      });
      if (removedNodes.length) fore.signalChangeToElement(parent.localName);
    } else if (nodesToDelete) {
      parent = nodesToDelete.parentNode;
      if (this._deleteXmlNode(parent, nodesToDelete)) {
        fore.signalChangeToElement(parent.localName);
        fore.signalChangeToElement(nodesToDelete.localName);
        removedNodes.push(nodesToDelete);
      }
    }

    if (!removedNodes.length) return;

    await Fore.dispatch(instance, 'deleted', {
      ref: path,
      deletedNodes: removedNodes,
      instanceId,
      parent,
      foreId: fore?.id,
    });

    this.needsUpdate = true;
  }

  _deleteXmlNode(parent, node) {
    if (!parent || !node) return false;

    if (
      parent.nodeType === Node.DOCUMENT_NODE ||
      node.nodeType === Node.DOCUMENT_NODE ||
      node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ||
      node.parentNode === null
    ) {
      return false;
    }

    const mi = this.getModel().getModelItem(node);
    if (mi?.readonly) return false;

    parent.removeChild(node);
    this.getModel().removeModelItem(node);
    return true;
  }
}

if (!customElements.get('fx-delete')) {
  window.customElements.define('fx-delete', FxDelete);
}
