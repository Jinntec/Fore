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
    this.precedingVariables = [];
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

      // Evaluate using the preceding variables snapshot (do NOT pull live variables here)
      const values = evaluateXPath(this.valueQuery, inscope, this, this.precedingVariables);

      // Cache typed value for other computations to consume without triggering evaluation
      this._value = typedValueFactory(values, domFacade);
      this.value = this._value;
    } finally {
      this._isRefreshing = false;
    }
  }

  /**
   * @param {Map<string, FxVariable>} inScopeVariables
   */
  setInScopeVariables(inScopeVariables) {
    if (inScopeVariables.has(this.name)) {
      console.error(`The variable ${this.name} is declared more than once`);
      Fore.dispatch(this, 'xforms-binding-error', {});
      return;
    }
    inScopeVariables.set(this.name, this);
    // Clone the preceding variables to make sure we are not going to get access to variables we
    // should not get access to
    this.inScopeVariables = new Map(inScopeVariables);

    // Set precedingVariables based on inScopeVariables
    this.precedingVariables = Array.from(inScopeVariables.entries()).map(([name, variable]) => {
      // IMPORTANT: do not trigger evaluation while taking the snapshot
      if (variable && variable._isRefreshing) {
        return { name, value: null };
      }
      return { name, value: variable?._value ?? variable?.value ?? null };
    });
  }
}
if (!customElements.get('fx-var')) {
  customElements.define('fx-var', FxVariable);
}
