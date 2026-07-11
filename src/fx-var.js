import { createTypedValueFactory, domFacade } from 'fontoxpath';
import { Fore } from './fore.js';
import './fx-instance.js';
import { evaluateXPath } from './xpath-evaluation.js';
import ForeElementMixin from './ForeElementMixin.js';
import getInScopeContext from './getInScopeContext.js';

// We are getting sequences here (evaluateXPath is returning all items, as an array)
// So wrap them into something so FontoXPath also understands they are sequences, always.
const typedValueFactory = createTypedValueFactory('item()*');

export class FxVariable extends ForeElementMixin {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.name = '';
    this.valueQuery = '';
    this.value = null;
    // Re-entrancy guard for variable evaluation
    this._isRefreshing = false;
    // Cached typed value (Fonto sequence wrapper)
    this._value = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.name = this.getAttribute('name');
    this.valueQuery = this.getAttribute('value');
  }

  refresh() {
    // Prevent re-entrant refresh loops (variable evaluation can consult variables again)
    if (this._isRefreshing) return;

    this._isRefreshing = true;
    try {
      // Ensure we have the current expression
      this.valueQuery = this.getAttribute('value') || this.valueQuery || '';

      const inscope = getInScopeContext(this, this.valueQuery);

      // Evaluate with the lexically scoped variables (preceding vars only), values read live
      const values = evaluateXPath(this.valueQuery, inscope, this, this._precedingVariables());

      // Cache typed value for other computations to consume without triggering evaluation
      this._rawValues = values;
      this._value = typedValueFactory(values, domFacade);
      this.value = this._value;
    } finally {
      this._isRefreshing = false;
    }
  }

  /**
   * Runs one evaluation point for this variable and reports whether its value changed.
   *
   * Comparison is shallow over the raw result sequence: node items by identity,
   * atomic items by value. A node-valued variable whose nodes mutated content but kept
   * identity is NOT flagged — variables hold node references, and consumers read the
   * current content through them.
   *
   * @returns {boolean} true when the raw result sequence differs from the previous one
   */
  refreshAndReportChange() {
    const before = this._rawValues;
    this.refresh();
    const after = this._rawValues;
    if (before === after) return false;
    if (!Array.isArray(before) || !Array.isArray(after)) return true;
    if (before.length !== after.length) return true;
    return before.some((item, i) => item !== after[i]);
  }

  /**
   * Variables visible to this var per lexical scoping: the entries of the Map cloned at
   * registration time (preceding vars only), with values read live at the evaluation point.
   * The var itself is excluded — a variable is not visible to its own value expression.
   *
   * @returns {Object<string, *>}
   * @private
   */
  _precedingVariables() {
    const variables = {};
    if (!this.inScopeVariables) return variables;
    for (const [name, variableOrValue] of this.inScopeVariables) {
      // eslint-disable-next-line no-continue
      if (!variableOrValue || variableOrValue === this) continue;
      if (variableOrValue.nodeType) {
        // eslint-disable-next-line no-continue
        if (variableOrValue._isRefreshing) continue;
        variables[name] = variableOrValue._value ?? variableOrValue.value ?? null;
      } else {
        variables[name] = variableOrValue;
      }
    }
    return variables;
  }

  /**
   * @param {Map<string, FxVariable>} inScopeVariables
   */
  setInScopeVariables(inScopeVariables) {
    if (inScopeVariables.has(this.name)) {
      console.error(`The variable ${this.name} is declared more than once`);
      Fore.dispatch(this, 'binding-error', {});
      return;
    }
    inScopeVariables.set(this.name, this);
    // Clone the preceding variables to make sure we are not going to get access to variables we
    // should not get access to
    this.inScopeVariables = new Map(inScopeVariables);
  }
}
if (!customElements.get('fx-var')) {
  customElements.define('fx-var', FxVariable);
}
