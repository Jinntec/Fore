import { XPathUtil } from './xpath-util.js';
import { FxModel } from './fx-model.js';
import {
  evaluateXPath,
  evaluateXPathToFirstNode,
  evaluateXPathToString,
} from './xpath-evaluation.js';
import getInScopeContext from './getInScopeContext.js';
import { Fore } from './fore.js';
import DependentXPathQueries from './DependentXPathQueries.js';
import { getPath } from './xpath-path.js';
import { DependencyNotifyingDomFacade } from './DependencyNotifyingDomFacade.js';

/**
 * Matches any XPath function call, optionally prefixed (e.g. `count(`, `fn:string-join(`).
 * Used by _refNeedsDependencyTracking after the navigation-anchor functions are stripped.
 */
const FUNCTION_CALL_RE = /[A-Za-z][\w.-]*(?::[A-Za-z][\w.-]*)?\s*\(/;

/**
 * Mixin containing all general functions that are shared by all Fore element classes.
 * @extends {HTMLElement}
 */
export default class ForeElementMixin extends HTMLElement {
  static get properties() {
    return {
      /**
       * context object for evaluation
       */
      context: {
        type: Object,
      },
      /**
       * the model of this element
       */
      model: {
        type: Object,
      },
      /**
       * The modelitem object associated to the bound node holding the evaluated state.
       */
      modelItem: {
        type: Object,
      },
      /**
       * the node(s) bound by this element
       */
      nodeset: {
        type: Object,
      },
      /**
       * XPath binding expression pointing to bound node
       */
      ref: {
        type: String,
      },
      inScopeVariables: {
        type: Map,
      },
    };
  }

  constructor() {
    super();
    this.context = null;
    this.model = null;
    this.modelItem = null;
    this.ref = this.hasAttribute('ref') ? this.getAttribute('ref') : '';
    /**
     * @type {Map<string, import('./fx-var.js').FxVariable>}
     */
    this.inScopeVariables = new Map();

    this.dependencies = new DependentXPathQueries();
    this.ownerForm = null;

    /**
     * ModelItems this element observes because its ref expression read their nodes.
     * Bucket-keyed: fx-control tracks two independent expressions (its own ref and its
     * widget's ref) — a single Set would make each eval wrongly unregister the other's
     * observers when diffing.
     * @type {Map<string, Set<import('./modelitem.js').ModelItem>>}
     */
    this._refTrackedModelItems = new Map();
  }

  getDebugInfo() {
    return {
      localName: this.localName,
      id: this.id || null,
      ref: this.getAttribute?.('ref') || null,

      modelItemPath: this.modelItem?.path || null,
      instanceId: this.modelItem?.instanceId || null,

      value: this.modelItem?.value,

      relevant: this.modelItem?.relevant,
      readonly: this.modelItem?.readonly,
      required: this.modelItem?.required,
      constraint: this.modelItem?.constraint,
    };
  }

  connectedCallback() {
    if (this.parentElement) {
      this.dependencies.setParentDependencies(this.parentElement?.closest('[ref]')?.dependencies);
    }

    // The fx-model linked to here won't ever change
    this.model = this.getModel();
    this.ownerForm = this.getOwnerForm();
  }

  /**
   * @returns {import('./fx-model.js').FxModel}
   */
  getModel() {
    // console.log('getModel this ', this);
    if (this.model) {
      return this.model;
    }
    // const ownerForm = this.closest('fx-fore');
    // const ownerForm = this.getOwnerForm(this);
    const ownerForm = this.getOwnerForm();
    return ownerForm.querySelector('fx-model');
  }

  /**
   *
   * @returns {import('./fx-fore.js').FxFore} The fx-fore element associated with this form node
   */
  getOwnerForm() {
    if (this.ownerForm) {
      return this.ownerForm;
    }
    let currentElement = this;
    while (currentElement && currentElement.parentNode) {
      // console.log('current ', currentElement);
      if (currentElement.nodeName.toUpperCase() === 'FX-FORE') {
        return currentElement;
      }

      if (currentElement.parentNode instanceof DocumentFragment) {
        currentElement = currentElement.parentNode.host;
      } else {
        currentElement = currentElement.parentNode;
      }
    }
    return null;
  }

  /**
   * Decides whether a ref expression needs generic dependency tracking. Navigation-only
   * refs bind to exactly the node they return — attachObserver() already covers those.
   * A ref that filters (predicate) or computes (any function call) reads nodes it never
   * binds to, so its result can go stale without tracking. instance() and index() are
   * navigation anchors, not computations: instance() only selects the evaluation root,
   * and index() is handled by a dedicated 'item-changed' listener in UIElement.
   * Restricted to elements with an `update()` observer callback (skips fx-bind).
   * `$var`-only refs are covered by the variable-change consumer instead.
   *
   * @param {string} [refString] the expression to check, defaults to this element's ref
   * @returns {boolean}
   */
  _refNeedsDependencyTracking(refString = this.ref) {
    if (!refString) return false;
    if (typeof this.update !== 'function') return false;
    if (refString.includes('[')) return true;
    const stripped = refString.replace(/\b(?:instance|index)\s*\(/g, '');
    return FUNCTION_CALL_RE.test(stripped);
  }

  /**
   * Resolves a node touched during ref evaluation to its (possibly lazily created)
   * ModelItem so this element can observe it.
   *
   * @param {import('./fx-model.js').FxModel} model
   * @param {Node} touchedNode a node reported by DependencyNotifyingDomFacade
   * @returns {import('./modelitem.js').ModelItem|null}
   */
  _resolveModelItemForTouchedNode(model, touchedNode) {
    let targetNode = touchedNode;
    if (targetNode?.nodeType === Node.TEXT_NODE) targetNode = targetNode.parentNode;
    if (!targetNode) return null;
    return (
      model.getModelItem(targetNode) ??
      // the touched node may live in a different instance than the ref's primary one —
      // resolve its instance per node, not from the expression
      FxModel.lazyCreateModelItem(
        model,
        this.ref,
        targetNode,
        this,
        model.getInstanceIdForNode(targetNode),
      )
    );
  }

  /**
   * Registers this element as observer on the ModelItems of all nodes its ref
   * evaluation touched, and unregisters from ModelItems no longer read (per bucket).
   *
   * @param {Set<Node>} touchedNodes nodes reported by DependencyNotifyingDomFacade
   * @param {string} [bucket] tracking bucket, e.g. 'ref' or 'widget'
   */
  _trackRefDependencies(touchedNodes, bucket = 'ref') {
    const model = this.getModel();
    if (!model) return;
    const newModelItems = new Set();
    touchedNodes.forEach(n => {
      const mi = this._resolveModelItemForTouchedNode(model, n);
      if (mi) newModelItems.add(mi);
    });
    const previous = this._refTrackedModelItems.get(bucket);
    previous?.forEach(mi => {
      if (!newModelItems.has(mi)) mi.removeObserver(this);
    });
    newModelItems.forEach(mi => mi.addObserver(this));
    this._refTrackedModelItems.set(bucket, newModelItems);
  }

  /**
   * evaluation of fx-bind and UiElements differ in details so that each class needs it's own implementation.
   */
  evalInContext() {
    this.dependencies.resetDependencies();
    // const inscopeContext = this.getInScopeContext();
    const model = this.getModel();
    if (!model) {
      return;
    }
    let inscopeContext;
    if (this.hasAttribute('context')) {
      inscopeContext = getInScopeContext(this.getAttributeNode('context') || this, this.context);
    }
    if (this.hasAttribute('ref')) {
      inscopeContext = getInScopeContext(this.getAttributeNode('ref') || this, this.ref);
      this.dependencies.addXPath(this.ref);
    }
    if (!inscopeContext && this.getModel().instances.length !== 0) {
      // ### always fall back to default context with there's neither a 'context' or 'ref' present
      inscopeContext = this.getModel().getDefaultInstance().getDefaultContext();
      // console.warn('no in scopeContext for ', this);
      // console.warn('using default context ', this);
      // return;
    }
    let touchedNodes = null;
    let domFacade = null;
    if (this._refNeedsDependencyTracking()) {
      touchedNodes = new Set();
      domFacade = new DependencyNotifyingDomFacade(node => touchedNodes.add(node));
    }

    if (this.ref === '') {
      this.nodeset = inscopeContext;
    } else if (Array.isArray(inscopeContext)) {
      /*
      inscopeContext.forEach(n => {
        if (XPathUtil.isSelfReference(this.ref)) {
        this.nodeset = inscopeContext;
        } else {
        const localResult = evaluateXPathToFirstNode(this.ref, n, this);
        // console.log('local result: ', localResult);
        this.nodeset.push(localResult);
        }
      });
  */
      // this.nodeset = evaluateXPathToFirstNode(this.ref, inscopeContext[0], this);
      this.nodeset = evaluateXPath(this.ref, inscopeContext[0], this, {}, {}, domFacade);
    } else {
      // this.nodeset = fx.evaluateXPathToFirstNode(this.ref, inscopeContext, null, {namespaceResolver: this.namespaceResolver});
      if (!inscopeContext) return;
      if (this.nodeName === 'FX-REPEAT') {
        // Repeats are special: they have multiple nodes in their nodeset
        this.nodeset = evaluateXPath(this.ref, inscopeContext, this, {}, {}, domFacade);
      } else {
        this.nodeset = evaluateXPath(this.ref, inscopeContext, this, {}, {}, domFacade)[0] || null;
      }
    }
    if (touchedNodes) {
      this._trackRefDependencies(touchedNodes);
    }
    // console.log('UiElement evaluated to nodeset: ', this.nodeset);
  }

  /**
   * resolves template expressions for a single attribute
   * @param {string} expr an attribute value containing curly brackets containing XPath expressions to evaluate
   * @param {Node} node the attribute node used for scoped resolution
   * @returns {string}
   * @protected
   */
  evaluateAttributeTemplateExpression(expr, node) {
    const matches = expr.match(/{[^}]*}/g);
    if (matches) {
      matches.forEach(match => {
        // console.log('match ', match);
        const naked = match.substring(1, match.length - 1);
        const inscope = getInScopeContext(node, naked);
        const result = evaluateXPathToString(naked, inscope, this.getOwnerForm());
        const replaced = expr.replaceAll(match, result);
        // console.log('replacing ', expr, ' with ', replaced);
        expr = replaced;
      });
    }
    return expr;
  }

  isNotBound() {
    return !this.hasAttribute('ref');
  }

  isBound() {
    return this.hasAttribute('ref');
  }

  getBindingExpr() {
    if (this.hasAttribute('ref')) {
      return this.getAttribute('ref');
    }
    // try to get closest parent bind
    const parent = XPathUtil.getClosest('[ref]', this.parentNode);
    if (!parent) {
      return 'instance()'; // the default instance
    }
    return parent.getAttribute('ref');
  }

  /**
   * @returns {import('./fx-instance.js').FxInstance}
   */
  getInstance() {
    if (this.ref.startsWith('instance(')) {
      const instId = XPathUtil.getInstanceId(this.ref);
      return this.getModel().getInstance(instId);
    }
    return this.getModel().getInstance('default');
  }

  _getParentBindingElement(start) {
    if (start.parentNode.host) {
      const { host } = start.parentNode;
      if (host.hasAttribute('ref')) {
        return host;
      }
    } else if (start.parentNode) {
      if (start.parentNode.hasAttribute('ref')) {
        return this.parentNode;
      }
      this._getParentBindingElement(this.parentNode);
    }
    return null;
  }

  /**
   * @returns {import('./modelitem.js').ModelItem}
   */
  /**
   * @returns {import('./modelitem.js').ModelItem}
   */
  getModelItem() {
    if (!this.getModel()) return null;

    const model = this.getModel();

    // Resolve the effective bound node for repeated contexts
    const repeated = XPathUtil.getClosest('fx-repeatitem', this);
    let effectiveNode = this.nodeset;

    if (repeated) {
      const { index } = repeated;
      if (Array.isArray(effectiveNode)) {
        effectiveNode = effectiveNode[index - 1];
      }
    }

    // 1) Try exact lookup by node OR lens object (model.getModelItem was updated earlier)
    let existed = effectiveNode ? model.getModelItem(effectiveNode) : null;
    if (existed) {
      this.modelItem = existed;
      return existed;
    }

    // 2) Try lookup by canonical path (XML + JSON)
    const instanceId = XPathUtil.resolveInstance(this, this.ref);

    // Normalize XML text node -> parent
    let targetNode = effectiveNode;
    if (targetNode?.nodeType === Node.TEXT_NODE) targetNode = targetNode.parentNode;

    let path = null;

    // XML node path
    if (targetNode?.nodeType) {
      path = getPath(targetNode, instanceId);
    }
    // JSON lens node path (preferred)
    else if (targetNode?.__jsonlens__ && typeof targetNode.getPath === 'function') {
      // JSONNode.getPath() already returns the canonical path you want
      path = targetNode.getPath();
    }
    // As a last resort: try getPath() util for JSON lens nodes if it supports them
    else if (targetNode?.__jsonlens__) {
      try {
        path = getPath(targetNode, instanceId);
      } catch (_e) {
        // ignore
      }
    }

    if (path) {
      existed = model._modelItemsByPath.get(path) || null;
      if (existed) {
        // CRITICAL: retarget existing ModelItem to the current backing object
        const isLensObject =
          targetNode &&
          typeof targetNode === 'object' &&
          typeof targetNode.get === 'function' &&
          typeof targetNode.set === 'function';

        model._setModelItemTarget(
          existed,
          isLensObject ? { lens: targetNode } : { node: targetNode },
        );

        this.modelItem = existed;
        return existed;
      }
    }

    // 3) Not found: lazily create (lazyCreateModelItem now dedupes/retargets by path)
    const lazyCreatedModelItem = FxModel.lazyCreateModelItem(model, this.ref, effectiveNode, this);
    this.modelItem = lazyCreatedModelItem;
    return lazyCreatedModelItem;
  }

  /**
   * Returns the effective value for the element.
   * a: look for 'value' attribute and if present evaluate it and return the resulting value
   * b: look for textContent and return the value if present
   * c: return null
   * @returns {string}
   */
  getValue() {
    if (this.hasAttribute('value')) {
      const valAttr = this.getAttribute('value');
      try {
        const inscopeContext = getInScopeContext(this, valAttr);
        return evaluateXPathToString(valAttr, inscopeContext, this.getOwnerForm());
      } catch (error) {
        console.error(error);
        Fore.dispatch(this, 'error', { message: error });
      }
    }
    if (this.textContent) {
      return this.textContent;
    }
    return null;
  }

  /**
   * @returns {Node}
   */
  getInScopeContext() {
    return getInScopeContext(this.getAttributeNode('ref') || this, this.ref);
  }

  /**
   * Set variables in scope here
   * @param {Map} inScopeVariables
   */
  setInScopeVariables(inScopeVariables) {
    this.inScopeVariables = inScopeVariables;
  }
}
