import { foreElementMixin } from '../ForeElementMixin.js';
import { evaluateXPathToBoolean } from '../xpath-evaluation.js';
import { Fore } from '../fore.js';

/**
 * `fx-action`
 * a button triggering Fore actions
 *
 * @customElement
 * @demo demo/index.html
 */
export class FxAction extends foreElementMixin(HTMLElement) {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();

    this.needsRebuild = false;
    this.needsRecalculate = false;
    this.needsRevalidate = false;
    this.needsRefresh = false;
  }

  connectedCallback() {
    this.style.display = 'none';

    if (this.hasAttribute('event')) {
      this.event = this.getAttribute('event');
    } else {
      this.event = 'activate';
    }

    this.target = this.getAttribute('target');
    if (this.target) {
      this.targetElement = document.getElementById(this.target);
      this.targetElement.addEventListener(this.event, () => this.execute());
    } else {
      this.targetElement = this.parentNode;
      this.targetElement.addEventListener(this.event, e => this.execute(e));
      // console.log('adding listener for ', this.event , ` to `, this);
    }

    this.ifExpr = this.hasAttribute('if')?this.getAttribute('if'):null;
  }

  /**
   * executes the action. This function is usually triggered by a fx-trigger.
   *
   *
   * @param e
   * @returns {boolean} result of evaluation of the if expression. Concrete actions check for that before doing their task.
   */
  execute(e) {
    console.log('execute e ', e);
    console.log('execute this ', this);

    if (this.isBound()) {
      this.evalInContext();
    }

    // ### evaluate if expression and return result to caller
    const ifExpr = this.hasAttribute('if')?this.getAttribute('if'):null;
    if(ifExpr){
      return evaluateXPathToBoolean(ifExpr, this.nodeset, this.getOwnerForm(), Fore.namespaceResolver);
    }
    return true;
  }

  actionPerformed() {

    console.log('action parentNode ', this.parentNode);

    const model = this.getModel();
    if (this.needsRebuild) {
      model.rebuild();
    }
    if (this.needsRecalculate) {
      model.recalculate();
    }
    if (this.needsRevalidate) {
      model.revalidate();
    }
    if (this.needsRefresh) {
      model.parentNode.refresh();
    }
  }

  dispatchActionPerformed() {
    this.dispatchEvent(
      new CustomEvent('action-performed', { composed: true, bubbles: true, detail: {} }),
    );
  }
}

window.customElements.define('fx-action', FxAction);
