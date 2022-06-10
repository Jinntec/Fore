import { Fore } from './fore.js';
import './fx-instance.js';
import { evaluateXPath } from './xpath-evaluation.js';
import { foreElementMixin } from './ForeElementMixin.js';
import getInScopeContext from './getInScopeContext.js';

/**
 * @ts-check
 */
export class FxVariable extends foreElementMixin(HTMLElement) {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.name = '';
    this.valueQuery = '';
    this.value = null;
  }

  connectedCallback() {
    this.name = this.getAttribute('name');
    this.valueQuery = this.getAttribute('value');
  }

  refresh() {
    const inscope = getInScopeContext(this, this.valueQuery);

    const values = evaluateXPath(this.valueQuery, inscope, this, this.precedingVariables);
    [this.value] = values;
  }

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
  }
}
if (!customElements.get('fx-var')) {
  customElements.define('fx-var', FxVariable);
}