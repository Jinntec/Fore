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
  /**
   * @param {string} path - Calculated normalized path expression linking to data
   * @param {string} ref - Relative binding expression
   * @param {boolean} readonly - Signals readonly/readwrite state
   * @param {boolean} relevant - Signals relevant/non-relevant state
   * @param {boolean} required - Signals required/optional state
   * @param {boolean} constraint - Signals valid/invalid state
   * @param {string} type - Data type expression
   * @param {Node} node - The node the 'ref' expression is referring to
   * @param {import('./fx-bind').FxBind} bind - The fx-bind element having created this ModelItem
   * @param {string} instance - The fx-instance id having created this ModelItem
   */
  constructor(path, ref, readonly, relevant, required, constraint, type, node, bind, instance) {
    this.path = path;
    this.ref = ref;
    this.readonly = readonly;
    this.relevant = relevant;
    this.required = required;
    this.constraint = constraint;
    this.type = type;
    this.node = node;
    this.bind = bind;
    this.instanceId = instance;
    this.changed = false;

    /** @type {import('./ui/fx-alert').FxAlert[]} */
    this.alerts = [];

    /** @type {import('./ui/abstract-control').default[]} */
    this.boundControls = [];

    // Observable mechanics
    this.observers = new Set();
    this.dependencies = new Set();
    this.stateExpressions = {}; // e.g. { required: { expr: '../x', type: 'boolean' } }
    this.state = {}; // evaluated expression results
  }

  get value() {
    if (!this.node) return null;
    if (!this.node.nodeType) return this.node;
    if (this.node.nodeType === Node.ATTRIBUTE_NODE) {
      return this.node.nodeValue;
    }
    return this.node.textContent;
  }

  set value(newVal) {
    if (!this.node) return;
    const oldVal = this.value;

    if (newVal?.nodeType === Node.DOCUMENT_NODE) {
      this.node.replaceWith(newVal.firstElementChild);
      this.node = newVal.firstElementChild;
    } else if (newVal?.nodeType === Node.ELEMENT_NODE) {
      this.node.replaceWith(newVal);
      this.node = newVal;
    } else if (this.node.nodeType === Node.ATTRIBUTE_NODE) {
      this.node.nodeValue = newVal;
    } else {
      this.node.textContent = newVal;
    }

    if (this.value !== oldVal) {
      this.notify();
    }
  }

  addObserver(observer) {
    this.observers.add(observer);
  }

  removeObserver(observer) {
    this.observers.delete(observer);
  }

  notify() {
    console.log('[ModelItem] notifying observers');
    if (this.observers) {
      this.observers.forEach(observer => {
        if (typeof observer.update === 'function') {
          observer.update(this);
        }
      });
    }
  }

  update() {
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
