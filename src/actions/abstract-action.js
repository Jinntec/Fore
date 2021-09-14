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
      detail: {
        type: Object,
      },
      needsUpdate: {
        type: Boolean,
      },
    };
  }

  constructor() {
    super();
    this.detail = {};
    this.needsUpdate = false;
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
      if (this.target === '#document') {
        document.addEventListener(this.event, e => this.execute(e));
      } else {
        this.targetElement = document.getElementById(this.target);
        this.targetElement.addEventListener(this.event, e => this.execute(e));
      }
    } else {
      this.targetElement = this.parentNode;
      this.targetElement.addEventListener(this.event, e => this.execute(e));
      // console.log('adding listener for ', this.event , ` to `, this);
    }

    this.ifExpr = this.hasAttribute('if') ? this.getAttribute('if') : null;
    this.whileExpr = this.hasAttribute('while') ? this.getAttribute('while') : null;
    this.delay = this.hasAttribute('delay') ? Number(this.getAttribute('delay')) : 0;
  }

  /**
   * executes the action.
   *
   * @param e
   */
  // eslint-disable-next-line no-unused-vars
  async execute(e) {
    console.log('executing', this);
    if (e && e.detail) {
      this.detail = e.detail;
    }
    this.needsUpdate = false;

    this.evalInContext();
    if (this.targetElement && this.targetElement.nodeset) {
      this.nodeset = this.targetElement.nodeset;
    }

    /*
    First check if 'if' condition is true - otherwise exist right away
     */
    if (this.ifExpr) {
      if (evaluateXPathToBoolean(this.ifExpr, this.nodeset, this.getOwnerForm()) === false) {
        return;
      }
    }

    if (this.whileExpr) {
      const doSomething = () =>
        new Promise(resolve => {
          /*
             The default delay is 0 so we can use setTimeout regardless if a 'delay' attribute exists
             on this element.
             */
          setTimeout(() => {
            const expr =
              evaluateXPathToBoolean(this.whileExpr, this.nodeset, this.getOwnerForm()) === true;
            resolve(expr);
          }, this.delay);
        });

      const loop = () =>
        doSomething().then(result => {
          if (result === false) {
            console.log('loop done');
          } else {
            this.perform();
            return loop();
          }
          return null;
        });

      /*
      after loop is done call actionPerformed to update the model and UI
       */
      await loop().then(() => this.actionPerformed());
    } else if (this.delay) {
      setTimeout(() => {
        this.perform();
        this.actionPerformed();
      }, this.delay);
    } else {
      this.perform();
      this.actionPerformed();
    }
  }

  /**
   * Template method to be implemented by each action that is called by execute() as part of
   * the processing.
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
    console.log('action-performed ', this);
    this.dispatchEvent(
      new CustomEvent('action-performed', { composed: true, bubbles: true, detail: {} }),
    );
  }
}

window.customElements.define('abstract-action', AbstractAction);
