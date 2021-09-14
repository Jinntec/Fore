import { foreElementMixin } from '../ForeElementMixin.js';
import { evaluateXPathToBoolean } from '../xpath-evaluation.js';

async function wait(howLong) {
  return new Promise(resolve => setTimeout(() => resolve(), howLong));
}

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

    // First check if 'if' condition is true - otherwise exist right away
    if (this.ifExpr && !evaluateXPathToBoolean(this.ifExpr, this.nodeset, this.getOwnerForm())) {
      return;
    }

    if (this.whileExpr) {
      // While: while the condition is true, delay a bit and execute the action
      const loop = async () => {
        // Start by waiting
        await wait(this.delay || 0);

        if (!this.ownerDocument.contains(this)) {
          // We are no longer in the document. Stop working
          return;
        }

        if (!evaluateXPathToBoolean(this.whileExpr, this.nodeset, this.getOwnerForm())) {
          // Done with iterating
          return;
        }

        // Perform the action once
        this.perform();

        // Go for one more iteration
        await loop();
      };

      // After loop is done call actionPerformed to update the model and UI
      await loop();
      this.actionPerformed();
      return;
    }

    if (this.delay) {
      // Delay further execution until the delay is done
      await wait(this.delay);
      if (!this.ownerDocument.contains(this)) {
        // We are no longer in the document. Stop working
        this.actionPerformed();
        return;
      }
    }

    this.perform();
    this.actionPerformed();
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
