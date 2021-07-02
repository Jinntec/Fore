import { foreElementMixin } from '../ForeElementMixin.js';
import { evaluateXPathToBoolean } from '../xpath-evaluation.js';

/**
 * `fx-action`
 * a button triggering Fore actions
 *
 * @customElement
 * @demo demo/index.html
 */
export class AbstractAction extends foreElementMixin(HTMLElement) {
  static get properties() {
    return {
      ...super.properties,
      detail:{
        type:Object
      },
      needsUpdate: {
        type: Boolean,
      },
      ifCondition: {
        type: Boolean,
      }
    };
  }

  constructor() {
    super();
    this.detail={};
    this.needsUpdate = false;
    this.ifCondition = false;
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
      if(this.target === '#document'){
        document.addEventListener(this.event, e => this.execute(e));
      }else{
        this.targetElement = document.getElementById(this.target);
        this.targetElement.addEventListener(this.event, e => this.execute(e));
      }
    } else {
      this.targetElement = this.parentNode;
      this.targetElement.addEventListener(this.event, e => this.execute(e));
      // console.log('adding listener for ', this.event , ` to `, this);
    }

    this.ifExpr = this.hasAttribute('if') ? this.getAttribute('if') : null;
  }

  /**
   * executes the action. This function is usually triggered by a fx-trigger.
   *
   * @param e
   */
  // eslint-disable-next-line no-unused-vars
  execute(e) {

    if(e && e.detail){
      this.detail = e.detail;
    }
    this.needsUpdate = false;
    if (this.isBound()) {
      this.evalInContext();
    }

    if (this.ifExpr) {
      if (this.nodeset === undefined) {
        this.nodeset = this.targetElement.nodeset;
      }
      this.ifCondition = evaluateXPathToBoolean(this.ifExpr, this.nodeset, this.getOwnerForm());
      if (this.ifCondition) {
        this.perform();
      }
    } else {
      this.perform(this.detail);
    }
    this.actionPerformed();
  }

  /**
   * this should only be called by bound actions
   *
   * todo: review - this could probably just be empty or throw error signalling that extender needs to implement it
   */
  perform() {
    if (this.isBound() || this.nodeName === 'FX-ACTION') {
      this.evalInContext();
    }
  }

  actionPerformed() {
    // console.log('actionPerformed action parentNode ', this.parentNode);
    if (this.needsUpdate) {
      const model = this.getModel();
      model.recalculate();
      model.revalidate();
      model.parentNode.refresh();
      this._dispatchActionPerformed();
    }
  }

  _dispatchActionPerformed() {
    // console.log('action-performed ', this);
    this.dispatchEvent(
      new CustomEvent('action-performed', { composed: true, bubbles: true, detail: {} }),
    );
  }
}

window.customElements.define('abstracdt-action', AbstractAction);
