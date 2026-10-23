/* eslint-disable max-classes-per-file */
import { DependencyNotifyingDomFacade } from './DependencyNotifyingDomFacade.js';

/**
 * Expressions that read something other than instance nodes: variables, the event, repeat indexes, the clock, custom
 * (prefixed) functions, JSON lenses. Their result cannot be derived from the nodes they touched, so they are
 * evaluated on every refresh.
 */
const VOLATILE_EXPR =
  /\$|\?|\b(?:index|event|depends|context|current|element|log|logtree|parse|fore-attr|local-date|local-dateTime|position|last|random|uuid|id|doc|collection|unparsed-text)\s*\(|\bcurrent-(?:date|time|dateTime)|\b(?!(?:fn|math|map|array|xs|xf|xsl)\b)[\w-]+:[\w-]+\s*\(/;

/**
 * Reports the node an XPath step is read from as touched as well, not just what it returns: a template that counts or
 * lists children has to notice that a child was added, which the child nodes themselves cannot tell.
 */
class TemplateDependencyFacade extends DependencyNotifyingDomFacade {
  getChildNodes(node, bucket) {
    this._onNodeTouched(node);
    return super.getChildNodes(node, bucket);
  }

  getFirstChild(node, bucket) {
    this._onNodeTouched(node);
    return super.getFirstChild(node, bucket);
  }

  getLastChild(node, bucket) {
    this._onNodeTouched(node);
    return super.getLastChild(node, bucket);
  }

  getNextSibling(node, bucket) {
    if (node.parentNode) this._onNodeTouched(node.parentNode);
    return super.getNextSibling(node, bucket);
  }

  getPreviousSibling(node, bucket) {
    if (node.parentNode) this._onNodeTouched(node.parentNode);
    return super.getPreviousSibling(node, bucket);
  }

  // an attribute that is not there yet is not touched at all - but it may be added
  getAttribute(node, attributeName) {
    this._onNodeTouched(node);
    return super.getAttribute(node, attributeName);
  }
}

/**
 * Lets a fx-fore skip template expressions (`{...}` in text and attributes) whose input did not change.
 *
 * Evaluating an expression records which nodes it touched. A MutationObserver on the data of every instance says what
 * changed since the last round; an expression is evaluated again only if it touched a changed node, its context moved,
 * or the instances were replaced. Anything that cannot be decided that way (variables, custom functions, data that is
 * not a DOM) is never skipped.
 *
 * Usage per round: `begin()`, then `isFresh()` / `record()` / `forget()` per expression, then `end()`.
 */
export class TemplateDependencyTracker {
  /**
   * @param {() => Node[]} getRoots the root nodes of the instance data of the form
   */
  constructor(getRoots) {
    this._getRoots = getRoots;
    /** @type {Map<Node, MutationObserver>} */
    this._observers = new Map();
    /** @type {Node[]} */
    this._roots = [];
    this._rootsVersion = 0;
    /** @type {Set<Node>} */
    this._dirty = new Set();
    /** @type {WeakMap<Node, {contexts: Node[], touched: Set<Node>, rootsVersion: number}>} */
    this._records = new WeakMap();
    this._enabled = typeof MutationObserver === 'function';
  }

  /** Picks up what changed since the last round and makes sure the current instance data is observed. */
  begin() {
    if (!this._enabled) return;
    const roots = this._getRoots().filter(r => r && typeof r.nodeType === 'number');
    const same = roots.length === this._roots.length && roots.every((r, i) => r === this._roots[i]);
    if (!same) {
      this._rootsVersion += 1;
      this._roots = roots;
      this._observers.forEach((observer, root) => {
        if (!roots.includes(root)) {
          observer.disconnect();
          this._observers.delete(root);
        }
      });
    }
    roots.forEach(root => {
      if (this._observers.has(root)) return;
      // records are delivered here at the end of the task that made the change; takeRecords() gets the ones still queued
      const observer = new MutationObserver(records => records.forEach(r => this._markDirty(r)));
      observer.observe(root, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });
      this._observers.set(root, observer);
    });
    this._observers.forEach(observer => {
      observer.takeRecords().forEach(record => this._markDirty(record));
    });
  }

  /** The changes have been dealt with by every expression. */
  end() {
    this._dirty.clear();
  }

  _markDirty(record) {
    const { target } = record;
    this._dirty.add(target);
    if (record.type === 'characterData' && target.parentNode) this._dirty.add(target.parentNode);
    record.addedNodes.forEach(n => this._dirty.add(n));
    record.removedNodes.forEach(n => this._dirty.add(n));
  }

  /**
   * @param {string} expr the text of the template expression
   * @param {Element} definitionElement the element it is defined on
   * @returns {boolean} whether the result can be derived from the nodes it touches
   */
  canTrack(expr, definitionElement) {
    if (!this._enabled || VOLATILE_EXPR.test(expr)) return false;
    return !definitionElement?.closest?.('[context],[iterate]');
  }

  /** @returns {{facade: TemplateDependencyFacade, touched: Set<Node>}} */
  // eslint-disable-next-line class-methods-use-this
  createFacade() {
    const touched = new Set();
    return { facade: new TemplateDependencyFacade(node => touched.add(node)), touched };
  }

  _isObserved(node) {
    return this._roots.some(root => root === node || root.contains(node));
  }

  /**
   * @param {Node} node the node holding the template expression
   * @param {Node[]} contexts the context of each `{...}` in it
   * @returns {boolean} true if evaluating it again could not give another result
   */
  isFresh(node, contexts) {
    const record = this._records.get(node);
    if (!record || record.rootsVersion !== this._rootsVersion) return false;
    if (record.contexts.length !== contexts.length) return false;
    if (!record.contexts.every((c, i) => c === contexts[i])) return false;
    if (this._dirty.size === 0) return true;
    for (const touched of record.touched) {
      if (this._dirty.has(touched)) return false;
    }
    return true;
  }

  /**
   * Remembers the evaluation. Gives up (the expression is evaluated every time) if it touched anything that is not
   * part of the observed instance data.
   */
  record(node, contexts, touched) {
    const nodes = new Set();
    touched.forEach(n => nodes.add(n.nodeType === Node.ATTRIBUTE_NODE ? n.ownerElement : n));
    // a literal `{}` has no context (null)
    const real = contexts.filter(c => c !== null);
    const trackable = [...real, ...nodes].every(
      n => n && typeof n.nodeType === 'number' && this._isObserved(n),
    );
    if (!trackable) {
      this._records.delete(node);
      return;
    }
    real.forEach(c => nodes.add(c));
    this._records.set(node, { contexts, touched: nodes, rootsVersion: this._rootsVersion });
  }

  forget(node) {
    this._records.delete(node);
  }
}
