// src/actions/fx-delete.js

import { AbstractAction } from './abstract-action.js';
import { Fore } from '../fore.js';
import { XPathUtil } from '../xpath-util.js';
import getInScopeContext from '../getInScopeContext.js';
import { evaluateXPathToNodes } from '../xpath-evaluation.js';
import { getPath } from '../xpath-path.js';

/**
 * fx-delete
 *
 * XML: remove DOM nodes using XPath.
 * JSON: delete JSONNode(s) (node.__jsonlens__ === true) without calling FontoXPath.
 *
 * Key requirement for JSON:
 * - do NOT trigger full refresh
 * - emit 'deleted' with stable pre-delete indices so repeats can update incrementally
 * - update parent via parent.set(nextValue) so children are rebuilt (no "zombie rows")
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

    const ref = (this.getAttribute('ref') || this.ref || '.').trim() || '.';

    // IMPORTANT: keep correct scoping for vars/templates/repeats
    const inscope = getInScopeContext(this.getAttributeNode('ref') || this, ref);

    const instanceId = XPathUtil.resolveInstance(this, ref);
    const model = this.getModel();
    const instance = model.getInstance(instanceId);

    const isJson =
      !!instance &&
      (instance.type === 'json' ||
        (typeof instance.getAttribute === 'function' && instance.getAttribute('type') === 'json'));

    if (isJson) {
      // JSON path stays as-is
      return this._performJsonDelete(ref, inscope, instance, instanceId, fore);
    }

    // XML path restored to proper semantics (readonly + modelItems + root safety)
    return this._performXmlDelete(ref, inscope, instance, instanceId, fore);
  }

  async _performXmlDelete(ref, inscopeContext, instance, instanceId, fore) {
    const nodesToDelete = evaluateXPathToNodes(ref, inscopeContext, this);
    this.nodeset = nodesToDelete;

    // Nothing to do
    if (!nodesToDelete || (Array.isArray(nodesToDelete) && nodesToDelete.length === 0)) {
      return [];
    }

    // Normalize to array
    const nodes = Array.isArray(nodesToDelete) ? nodesToDelete : [nodesToDelete];

    // Never delete instance(), document nodes, or instance root element
    // (matches expectations in delete.test.js)
    const instRoot =
      instance && instance.instanceData && instance.instanceData.documentElement
        ? instance.instanceData.documentElement
        : null;

    const removedNodes = [];
    let parent = null;

    for (const node of nodes) {
      if (!node) continue;

      // hard stop: never delete document-ish nodes
      if (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        continue;
      }

      // hard stop: never delete instance root element
      if (instRoot && node === instRoot) {
        continue;
      }

      // Determine parent now (needed for event + safety checks)
      const p = node.parentNode;
      if (!p) continue;

      // Use the guarded delete helper (checks readonly + safety)
      if (this._deleteXmlNode(p, node)) {
        removedNodes.push(node);
        parent = p;

        // keep Fore’s change signaling (helps recalculation / refresh)
        try {
          if (node.localName) fore?.signalChangeToElement?.(node.localName);
        } catch (_e) {}
      }
    }

    if (removedNodes.length === 0) {
      // delete failed (eg readonly) => no refresh requested by tests
      return [];
    }

    // also signal parent changed
    try {
      if (parent?.localName) fore?.signalChangeToElement?.(parent.localName);
    } catch (_e) {}

    // Dispatch deleted event
    await Fore.dispatch(instance, 'deleted', {
      ref,
      deletedNodes: removedNodes,
      instanceId,
      parent,
      foreId: fore?.id,
      isJson: false,
    });

    this.needsUpdate = true;

    // return paths (not asserted by tests, but useful)
    try {
      return removedNodes.map(n => getPath(n, instanceId));
    } catch (_e) {
      return [];
    }
  }

  _deleteXmlNode(parent, node) {
    if (!parent || !node) return false;

    // Safety: do not delete documents / fragments / detached
    if (
      parent.nodeType === Node.DOCUMENT_NODE ||
      node.nodeType === Node.DOCUMENT_NODE ||
      node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ||
      node.parentNode === null
    ) {
      return false;
    }

    // Respect readonly facet
    const mi = this.getModel().getModelItem(node);
    if (mi?.readonly) return false;

    // Execute deletion
    parent.removeChild(node);

    // Remove ModelItems for the deleted subtree (this is what your failing tests assert)
    this.getModel().removeModelItem(node);

    return true;
  }
  // -----------------
  // JSON delete branch
  // -----------------

  async _performJsonDelete(ref, inscopeContext, instance, instanceId, fore) {
    const nodesToDelete = this._resolveJsonNodeset(ref, inscopeContext, instance);
    this.nodeset = nodesToDelete;

    if (!nodesToDelete || nodesToDelete.length === 0) {
      this.needsUpdate = true;
      return [];
    }

    // Snapshot stable info BEFORE mutation
    const deletedIndexes0 = Array.from(nodesToDelete)
      .map(n => (n && typeof n.keyOrIndex === 'number' ? n.keyOrIndex : -1))
      .filter(i => i >= 0);

    const parentBefore = nodesToDelete?.[0]?.parent || null;

    // For logging / execute-action
    const path = this._jsonNodesetPath(nodesToDelete);

    this.dispatchEvent(
      new CustomEvent('execute-action', {
        composed: true,
        bubbles: true,
        cancelable: true,
        detail: { action: this, event: this.event, path, isJson: true },
      }),
    );

    // Perform deletion (mutates via parent.set to rebuild children)
    const removed = this._deleteJsonNodes(nodesToDelete);

    if (!removed || removed.length === 0) {
      this.needsUpdate = true;
      return [];
    }

    // Build a repeat-routable ref so your repeat filter works:
    // repeat ref container is like: instance('data')?movies
    const repeatRef = this._buildRepeatContainerRef(ref, instanceId, parentBefore);

    await Fore.dispatch(instance, 'deleted', {
      // This MUST match repeat's container ref (not a $path)
      ref: repeatRef,

      // keep path for debugging
      path,

      deletedNodes: removed,
      deletedIndexes0,
      instanceId,
      parent: parentBefore,
      foreId: fore?.id,
      isJson: true,
    });

    // CRITICAL: do NOT trigger full refresh for JSON deletes
    this.needsUpdate = true;

    // return useful paths (optional)
    return removed.map(n => (typeof n.getPath === 'function' ? n.getPath() : '')).filter(Boolean);
  }

  _isJsonNode(n) {
    return !!n && n.__jsonlens__ === true;
  }

  _buildRepeatContainerRef(originalRef, instanceId, parent) {
    // If we deleted from an array container with a key like "movies", use that.
    if (parent && Array.isArray(parent.value) && typeof parent.keyOrIndex === 'string') {
      return `instance('${instanceId}')?${parent.keyOrIndex}`;
    }

    // Otherwise normalize the original ref:
    // - strip predicates/brackets
    // - strip trailing ?*
    // - strip trailing whitespace
    let s = String(originalRef || '').trim();
    s = s.replace(/\[[^\]]*\]/g, '');
    if (s.endsWith('?*')) s = s.slice(0, -2);
    return s || `instance('${instanceId}')`;
  }

  /**
   * Resolve ref to JSONNode(s) without calling fontoxpath.
   * Supports:
   *  - '.'
   *  - '?a?b'
   *  - "instance('id')?a?b"
   *  - '?*' (returns children)
   *  - bracket steps: '?movies[2]' and '?movies[index(\"movies\")]'
   */
  _resolveJsonNodeset(ref, inscopeContext, instance) {
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

      const attr = repeat.getAttribute('index');
      let idx = Number(attr);
      if (!Number.isFinite(idx) || idx < 1) idx = Number(repeat.index);

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

    if (ref === '.') {
      if (this._isJsonNode(inscopeContext)) return [inscopeContext];
      if (this._isJsonNode(instance?.nodeset)) return [instance.nodeset];
      return [];
    }

    const parsed = this._parseJsonLensRef(ref);
    if (!parsed) return [];

    const model = this.getModel();
    const targetInstance = model?.getInstance?.(parsed.instanceId) || instance;
    const root = targetInstance?.nodeset;
    if (!this._isJsonNode(root)) return [];

    let node = parsed.hasExplicitInstance
      ? root
      : this._isJsonNode(inscopeContext)
        ? inscopeContext
        : root;

    for (const step of parsed.steps) {
      if (!node) return [];

      if (step === '*') return Array.isArray(node.children) ? node.children : [];

      if (typeof step === 'number') {
        node = node.get(step) || null;
        continue;
      }

      if (typeof step === 'string') {
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
          node = container.get(idx0) || null;
          continue;
        }

        node = typeof node.get === 'function' ? node.get(step) : null;
        continue;
      }

      return [];
    }

    if (!node) return [];
    if (Array.isArray(node.value)) return node.children || [];
    return [node];
  }

  _parseJsonLensRef(ref, defaultInstanceId = 'default') {
    if (!ref) return null;
    const s = String(ref).trim();

    const instMatch = s.match(/^instance\s*\(\s*(['"])(.*?)\1\s*\)\s*(\?.*)?$/);
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
    const inst = first.instanceId || 'default';
    return `$${inst}/`;
  }

  /**
   * Delete JSON nodes by updating their parent via parent.set(nextValue).
   * This is the ONLY reliable way to prevent stale parent.children (zombie rows).
   */
  _deleteJsonNodes(nodes) {
    const model = this.getModel();
    const removed = [];

    const candidates = Array.from(nodes || []).filter(n => this._isJsonNode(n) && n.parent);

    // Group by parent so we can apply one parent.set per parent
    const byParent = new Map();
    for (const n of candidates) {
      const p = n.parent;
      if (!byParent.has(p)) byParent.set(p, []);
      byParent.get(p).push(n);
    }

    const canDelete = n => {
      try {
        const mi = model?.getModelItem?.(n);
        return !mi?.readonly;
      } catch (_e) {
        return true;
      }
    };

    for (const [parent, nodesForParent] of byParent.entries()) {
      const allowed = nodesForParent.filter(canDelete);
      if (allowed.length === 0) continue;

      // Array parent
      if (Array.isArray(parent.value)) {
        const indices = allowed
          .map(n => (typeof n.keyOrIndex === 'number' ? n.keyOrIndex : -1))
          .filter(i => i >= 0)
          .sort((a, b) => b - a);

        if (indices.length === 0) continue;

        const idxSet = new Set(indices);
        const next = parent.value.filter((_v, i) => !idxSet.has(i));

        if (typeof parent.set === 'function') {
          parent.set(next);
        } else {
          // Fallback: mutate (may still be stale if no set exists)
          indices.forEach(i => parent.value.splice(i, 1));
        }

        // record removed nodes (old node identities are fine for repeat removal)
        allowed.forEach(n => {
          removed.push(n);
          try {
            model?.removeModelItem?.(n);
          } catch (_e) {}
        });

        continue;
      }

      // Object parent
      if (parent.value && typeof parent.value === 'object') {
        const keys = allowed
          .map(n => (typeof n.keyOrIndex === 'string' ? n.keyOrIndex : null))
          .filter(Boolean);

        if (keys.length === 0) continue;

        const next = { ...parent.value };
        keys.forEach(k => delete next[k]);

        if (typeof parent.set === 'function') {
          parent.set(next);
        } else {
          keys.forEach(k => delete parent.value[k]);
        }

        allowed.forEach(n => {
          removed.push(n);
          try {
            model?.removeModelItem?.(n);
          } catch (_e) {}
        });
      }
    }

    return removed;
  }
}

if (!customElements.get('fx-delete')) {
  window.customElements.define('fx-delete', FxDelete);
}
