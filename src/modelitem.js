import { evaluateXPath, evaluateXPathToBoolean, evaluateXPathToNodes } from './xpath-evaluation';
import { XPathUtil } from './xpath-util';
import getInScopeContext from './getInScopeContext';

/**
 * Class for holding ModelItem facets.
 *
 * A ModelItem annotates nodes that are referred by an fx-bind element with facets for calculation and validation.
 * Each bound node in an instance has exactly one ModelItem associated with it.
 *
 * This refactored version includes observable mechanics and scoped XPath evaluation support.
 */
export class ModelItem {
  static READONLY_DEFAULT = false;
  static REQUIRED_DEFAULT = false;
  static RELEVANT_DEFAULT = true;
  static CONSTRAINT_DEFAULT = true;
  static TYPE_DEFAULT = 'xs:string';

  /**
   * @param {string} path - Calculated normalized path expression linking to data
   * @param {string} ref - Relative binding expression
   * @param {Node} node - The node the 'ref' expression is referring to
   * @param {import('./fx-bind').FxBind} bind - The fx-bind element having created this ModelItem
   * @param {string} instance - The fx-instance id having created this ModelItem
   * @param {import('./fx-fore').FxFore} fore - The fx-fore element this ModelItem belongs to
   */
  constructor(path, ref, nodeOrLens, bind, instance, fore) {
    this.path = path;
    this.ref = ref;
    this._readonly = ModelItem.READONLY_DEFAULT;
    this._relevant = ModelItem.RELEVANT_DEFAULT;
    // undefined = not yet resolved; null = resolved, no ancestor ModelItem found
    this._parentModelItem = undefined;
    this.required = ModelItem.REQUIRED_DEFAULT;
    this.constraint = ModelItem.CONSTRAINT_DEFAULT;
    this.type = ModelItem.TYPE_DEFAULT;
    this.node = null;
    this.lens = null;
    if (nodeOrLens?.get && nodeOrLens?.set) {
      this.lens = nodeOrLens;
    } else {
      this.node = nodeOrLens;
    }
    this.bind = bind;
    this.instanceId = instance;
    this.fore = fore;
    this.changed = false;
    this.nativeValid = true;

    // console.log('[ModelItem] created:', this.path);

    /** @type {import('./ui/fx-alert').FxAlert[]} */
    this.alerts = [];

    /** @type {import('./ui/abstract-control').default[]} */
    // For backward compatibility
    this.boundControls = [];

    // Observable mechanics
    /**
     * @type {Set<import('./ui/UIElement').UIElement>}
     */
    this.observers = new Set();
    this.dependencies = new Set();
    this.stateExpressions = {}; // e.g. { required: { expr: '../x', type: 'boolean' } }
    this.state = {}; // evaluated expression results
  }

  /**
   * `readonly` is inherited down the instance tree per XForms semantics: a node is
   * readonly if its own bind says so, or if any ancestor node is readonly.
   */
  get readonly() {
    return this._readonly || !!this.getParentModelItem()?.readonly;
  }

  set readonly(val) {
    this._readonly = val;
  }

  /**
   * `relevant` is inherited down the instance tree per XForms semantics: a node is
   * relevant only if its own bind says so AND its parent is (effectively) relevant.
   */
  get relevant() {
    if (!this._relevant) return false;
    const parent = this.getParentModelItem();
    return parent ? parent.relevant : true;
  }

  set relevant(val) {
    this._relevant = val;
  }

  /**
   * Resolves and caches the nearest ancestor ModelItem, walking past instance
   * nodes that have no ModelItem of their own. Handles both XML DOM nodes
   * (`node.parentNode`) and JSON lens nodes (`lens.parent`).
   * @returns {ModelItem|null}
   */
  getParentModelItem() {
    if (this._parentModelItem !== undefined) return this._parentModelItem;

    // `bind` is only set for ModelItems created from an explicit <fx-bind ref="...">.
    // Lazily-created ModelItems (e.g. controls without a dedicated bind - the exact
    // case this inheritance walk needs to cover) have no `bind`, so fall back to
    // resolving the owning FxModel through the fx-fore element instead.
    const model = this.bind?.model || this.fore?.getModel?.();
    // `Attr.parentNode` is always null per the DOM spec - attribute nodes only
    // expose their owning element via `ownerElement`. Without this, readonly/
    // relevant inheritance silently breaks for every attribute-bound ModelItem.
    let current;
    if (this.lens) {
      current = this.lens.parent;
    } else if (this.node?.nodeType === Node.ATTRIBUTE_NODE) {
      current = this.node.ownerElement;
    } else {
      current = this.node?.parentNode;
    }

    while (current) {
      if (
        current.nodeType === Node.DOCUMENT_NODE ||
        current.nodeType === Node.DOCUMENT_FRAGMENT_NODE
      ) {
        break;
      }

      const mi = model?.getModelItem(current);
      if (mi) {
        this._parentModelItem = mi;
        return mi;
      }

      current = current.__jsonlens__ === true ? current.parent : current.parentNode;
    }

    this._parentModelItem = null;
    return null;
  }

  getDebugInfo() {
    return {
      path: this.path,
      ref: this.ref,
      instanceId: this.instanceId,
      type: this.type,

      value: this.value,

      facets: {
        readonly: this.readonly,
        relevant: this.relevant,
        required: this.required,
        constraint: this.constraint,
        changed: this.changed,
      },

      backing: this.lens
          ? 'json-lens'
          : this.node
              ? 'xml-node'
              : 'unknown',

      observerCount: this.observers?.size || 0,
      boundControlCount: this.boundControls?.length || 0,
      dependencyCount: this.dependencies?.size || 0,
      alertCount: this.alerts?.length || 0,

      stateExpressions: this.stateExpressions,
      state: this.state,
    };
  }

  get value() {
    if (this.lens) return this.lens.get();
    if (!this.node) return null;
    if (!this.node.nodeType) return this.node;
    if (this.node.nodeType === Node.ATTRIBUTE_NODE) {
      return this.node.nodeValue;
    }
    return this.node.textContent;
  }

  set value(newVal) {
    if (this.lens) {
      const oldVal = this.lens.get();
      this.lens.set(newVal);
      if (oldVal !== newVal) this.notify();
      return;
    }

    if (!this.node) return;
    const oldVal = this.value;

    if (newVal?.nodeType && newVal.nodeType === Node.DOCUMENT_NODE) {
      this.node.replaceWith(newVal.firstElementChild);
      // this.node.appendChild(newVal.firstElementChild);
    } else if (newVal?.nodeType && newVal.nodeType === Node.ELEMENT_NODE) {
      this.node.replaceWith(newVal);
      // this.node.appendChild(newVal);
    } else if (newVal?.nodeType && this.node.nodeType === Node.ATTRIBUTE_NODE) {
      this.node.nodeValue = newVal;
    } else {
      this.node.textContent = newVal;
    }

    if (this.value !== oldVal) {
      this.notify();
    }
  }

  /**
   * Add an observer to this ModelItem
   * @param {Object} observer - The observer to add
   */
  addObserver(observer) {
    // console.log('[ModelItem] adding observer:', observer);
    this.observers.add(observer);

    // For backward compatibility with boundControls
    if (
      observer.nodeName &&
      (observer.nodeName.startsWith('FX-') || observer.nodeName.startsWith('UI-')) &&
      !this.boundControls.includes(observer)
    ) {
      this.boundControls.push(observer);
    }
  }

  /**
   * Remove an observer from this ModelItem
   * @param {Object} observer - The observer to remove
   */
  removeObserver(observer) {
    this.observers.delete(observer);

    // For backward compatibility with boundControls
    const index = this.boundControls.indexOf(observer);
    if (index !== -1) {
      this.boundControls.splice(index, 1);
    }
  }

  /**
   * Notify all observers that this ModelItem has changed
   */
  notify() {
    // Only log in debug mode or reduce verbosity to prevent console flooding
    // console.log('[ModelItem] notifying observers for path:', this);

    // Add to batched notifications. TODO: is the else needed?
    if (this.fore) {
      this.fore.addToBatchedNotifications(this);
    } else {
      // Otherwise, notify observers immediately
      if (this.observers) {
        this.observers.forEach(observer => {
          if (typeof observer.update === 'function') {
            observer.update(this);
          }
        });
      }
    }
  }

  update() {
    console.log('[ModelItem] update:', this);
    this.evaluateStateExpressions();
  }

  addAlert(alert) {
    if (!this.alerts.includes(alert)) {
      this.alerts.push(alert);
    }
  }

  cleanAlerts() {
    this.alerts = [];
  }

  /**
   * Attach dynamic expressions (fx-bind style) to this model item.
   * @param {{ [key: string]: { expr: string, type: 'boolean' | 'value' } }} expressionMap
   */
  setStateExpressions(expressionMap) {
    this.stateExpressions = expressionMap;
    this.resolveDependencies();
    this.evaluateStateExpressions();
  }

  /**
   * Register dependencies based on expression references.
   */
  resolveDependencies() {
    this.dependencies.forEach(dep => dep.removeObserver(this));
    this.dependencies.clear();

    const refs = Object.values(this.stateExpressions).flatMap(({ expr }) => this.extractRefs(expr));

    for (const ref of refs) {
      const dep = this.bind?.resolveModelItem?.(ref);
      if (dep) {
        dep.addObserver(this);
        this.dependencies.add(dep);
      }
    }
  }

  /**
   * Extract ref strings like '../required' => 'required'
   * @param {string} expr
   * @returns {string[]}
   */
  extractRefs(expr) {
    const matches = expr.match(/\.\.\/\w+/g);
    return matches ? matches.map(s => s.replace('../', '')) : [];
  }

  /**
   * Evaluate all state expressions attached to this model item.
   */
  evaluateStateExpressions() {
    let changed = false;

    for (const [key, { expr, type }] of Object.entries(this.stateExpressions)) {
      const result = this.evaluateExpression(expr, type);
      if (this.state[key] !== result) {
        this.state[key] = result;
        changed = true;
      }
    }

    if (changed) this.notify();
  }

  /**
   * Evaluate expression in in-scope context using XPath.
   * @param {string} expr
   * @param {'boolean' | 'value'} type
   * @returns {*}
   */
  evaluateExpression(expr, type = 'boolean') {
    const contextNodes = this._evalInContext();

    if (!contextNodes || contextNodes.length === 0) {
      return type === 'boolean' ? false : null;
    }

    try {
      if (type === 'boolean') {
        return contextNodes.some(node => evaluateXPathToBoolean(expr, node, this));
      } else if (type === 'value') {
        return evaluateXPath(expr, contextNodes[0], this);
      }
    } catch (e) {
      console.warn(`Error evaluating XPath expression [${expr}] in context:`, e);
      return type === 'boolean' ? false : null;
    }
  }

  /**
   * Resolves the in-scope context for this.ref using the bind and returns the nodeset.
   * Does NOT mutate this.nodeset or this.node.
   * @returns {Node[]}
   */
  _evalInContext() {
    const refAttrNode = this.bind?.getAttributeNode?.('ref') || this.bind;
    const inScopeContext = getInScopeContext(refAttrNode, this.ref);

    if (this.ref === '' || this.ref === null) {
      return Array.isArray(inScopeContext) ? inScopeContext : [inScopeContext];
    }

    if (Array.isArray(inScopeContext)) {
      if (XPathUtil.isSelfReference(this.ref)) {
        return inScopeContext;
      }
      return inScopeContext.flatMap(n => evaluateXPathToNodes(this.ref, n, this));
    }

    const instance = this.bind?.getInstance?.(this.instanceId);
    if (instance?.type === 'xml') {
      return evaluateXPathToNodes(this.ref, inScopeContext, this);
    }

    return [];
  }

}
