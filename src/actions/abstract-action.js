import { foreElementMixin } from '../ForeElementMixin.js';
import {evaluateXPathToBoolean} from "../xpath-evaluation.js";

/**
 * `fx-action`
 * a button triggering Fore actions
 *
 * @customElement
 * @demo demo/index.html
 */
export class AbstractAction extends foreElementMixin(HTMLElement) {

  constructor() {
    super();
    this.needsUpdate = false;
    this.ifCondition=false;
  }

  connectedCallback() {

    this.style.display = 'none';
    this.repeatContext = undefined;

    if (this.hasAttribute('event')) {
      this.event = this.getAttribute('event');
    } else {
      this.event = 'activate';
    }

    this.target = this.getAttribute('target');
    if (this.target) {
      this.targetElement = document.getElementById(this.target);
      this.targetElement.addEventListener(this.event, (e) => this.execute(e));
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
   * @param e
   */
  execute(e) {
    this.needsUpdate = false;
    if (this.isBound()) {
      this.evalInContext();
    }

    if(this.ifExpr){
      if(this.nodeset === undefined){
        this.nodeset = this.targetElement.nodeset;
      }
      this.ifCondition = evaluateXPathToBoolean(this.ifExpr, this.nodeset, this.getOwnerForm());
      if(this.ifCondition){
        this.perform();
      }
    }else{
      this.perform();
    }
    this.actionPerformed();
  }

  /**
   * this should only be called by bound actions
   */
  perform (){
    if (this.isBound() || this.nodeName === 'FX-ACTION') {
      this.evalInContext();
    }
  }

  actionPerformed() {
    // console.log('actionPerformed action parentNode ', this.parentNode);
    if(this.needsUpdate){
      const model = this.getModel();
      model.recalculate();
      model.revalidate();
      model.parentNode.refresh();
      this._dispatchActionPerformed();
    }
/*
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
*/
  }

  _dispatchActionPerformed() {
    // console.log('action-performed ', this);
    this.dispatchEvent(
      new CustomEvent('action-performed', { composed: true, bubbles: true, detail: {} }),
    );
  }
}

window.customElements.define('abstracdt-action', AbstractAction);
