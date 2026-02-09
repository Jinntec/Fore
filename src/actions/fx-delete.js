    // src/actions/fx-delete.js

import { AbstractAction } from './abstract-action.js';
import { Fore } from '../fore.js';
import { XPathUtil } from '../xpath-util.js';
import getInScopeContext from '../getInScopeContext.js';
import {evaluateXPathToNodes} from "../xpath-evaluation";
import {getPath} from "../xpath-path";

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
    const fore = this.getOwnerForm();
    const inscope = this.getInScopeContext();

    const ref = this.getAttribute('ref');
    if (!ref) return [];

    // Resolve nodes to delete
    const instanceId = XPathUtil.resolveInstance(this, ref);
    const model = this.getModel();
    const instance = model.getInstance(instanceId);

    // JSON branch
    const isJson = instance && (instance.type === 'json' || instance.getAttribute?.('type') === 'json');
    if (isJson) {
      const nodes = this._resolveJsonNodeset(ref, inscope, instance);

      if (!nodes || nodes.length === 0) return [];

      // Delete data + dispatch 'deleted' event (repeat listens and updates incrementally)
      const xpaths = this._deleteJsonNodes(nodes, instanceId, fore);

      // CRITICAL: do NOT trigger a forced refresh.
      // The incremental UI update happens via the 'deleted' event + batchedNotifications.
      this.needsUpdate = false;

      return xpaths;
    }

    // XML branch (existing behavior)
    const nodes = evaluateXPathToNodes(ref, inscope, this);
    if (!nodes || nodes.length === 0) return [];

    const xpaths = [];
    nodes.forEach(n => {
      xpaths.push(getPath(n, instanceId));
      n.parentNode.removeChild(n);
    });

    Fore.dispatch(instance, 'deleted', {
      deletedNodes: nodes,
      ref,
      instanceId,
      foreId: fore.id,
      isJson: false,
    });

    // XML deletes can still use normal refresh cycle (not forced)
    this.needsUpdate = true;
    return xpaths;
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
    // Helper: resolve index('repeatId') -> current 1-based repeat index
    const resolveIndexFunction = expr => {
      const s = String(expr ?? '').trim();
      const m = s.match(/^index\s*\(\s*(['"])(.*?)\1\s*\)\s*$/);
      if (!m) return null;

      const repeatId = m[2];
      const fore = this.getOwnerForm();
      if (!fore) return 1;

      let repeat = null;
      try {
        repeat = fore.querySelector(`#${CSS.escape(repeatId)}`);
      } catch (_e) {
        repeat = fore.querySelector(`#${repeatId}`);
      }
      if (!repeat) return 1;

      // prefer attribute 'index', fall back to property
      const attr = repeat.getAttribute('index');
      let idx = Number(attr);

      if (!Number.isFinite(idx) || idx < 1) {
        idx = Number(repeat.index);
      }

      return Number.isFinite(idx) && idx >= 1 ? idx : 1;
    };

    const resolveBracketIndex1 = idxExpr => {
      const t = String(idxExpr ?? '').trim();
      if (/^\d+$/.test(t)) return Number(t);

      const viaIndex = resolveIndexFunction(t);
      if (viaIndex !== null) return viaIndex;

      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    };

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

      // children wildcard
      if (step === '*') {
        return Array.isArray(node.children) ? node.children : [];
      }

      // numeric step (already parsed by _parseJsonLensRef): 0-based array index
      if (typeof step === 'number') {
        const arr = Array.isArray(node.value) ? node.children : node.children;
        if (!Array.isArray(arr)) return [];
        node = arr[step] || null;
        continue;
      }

      // string step
      if (typeof step === 'string') {
        // bracket syntax: movies[index('movies')] or movies[2]
        const bm = step.match(/^(.*?)\[(.+)\]$/);
        if (bm) {
          const prop = bm[1].trim();
          const idxExpr = bm[2].trim();

          const container = prop ? (typeof node.get === 'function' ? node.get(prop) : null) : node;
          if (!container) return [];

          if (!Array.isArray(container.value)) return [];

          const idx1 = resolveBracketIndex1(idxExpr);
          if (!Number.isFinite(idx1) || idx1 < 1) return [];

          const idx0 = idx1 - 1;
          node = container.children?.[idx0] || null;
          continue;
        }

        // normal property step
        node = typeof node.get === 'function' ? node.get(step) : null;
        continue;
      }

      // unknown step type
      return [];
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

  _deleteJsonNodes(nodes, instanceId, fore) {
    const model = this.getModel();
    const instance = model.getInstance(instanceId);

    const deleted = Array.from(nodes || []).filter(n => n && n.__jsonlens__);
    if (deleted.length === 0) return [];

    // We need the array container parent to route the event to the correct repeat
    // and for the repeat to rebind its nodeset cheaply.
    const parent =
        deleted[0]?.parent && Array.isArray(deleted[0].parent.value) ? deleted[0].parent : null;

    // Sort descending by old index so splicing is stable
    const sorted = deleted
        .slice()
        .sort((a, b) => (b.keyOrIndex ?? 0) - (a.keyOrIndex ?? 0));

    const paths = [];

    for (const node of sorted) {
      const idx0 = typeof node.keyOrIndex === 'number' ? node.keyOrIndex : -1;
      if (!parent || idx0 < 0) continue;

      // Mutate underlying JSON array
      parent.value.splice(idx0, 1);

      // Rebuild children so future resolution uses correct indices
      if (typeof parent._buildChildren === 'function') parent._buildChildren();

      // Path is informational; routing should use `parent` + instanceId
      const path = node.getPath ? node.getPath() : '';
      paths.push(path);
    }

    Fore.dispatch(instance, 'deleted', {
      deletedNodes: sorted,
      parent,                 // <-- this is what the repeat should use
      ref: this.getAttribute('ref'), // keep the original ref too (useful for debugging)
      instanceId,
      foreId: fore.id,
      isJson: true,
    });

    return paths;
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
