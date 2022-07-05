import { foreElementMixin } from '../ForeElementMixin.js';
import { evaluateXPathToBoolean, resolveId } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
import { Fore } from '../fore.js';

async function wait(howLong) {
  return new Promise(resolve => setTimeout(() => resolve(), howLong));
}

/**
 * Superclass for all action elements. Provides basic wiring of events to targets as well as
 * handle conditionals and loops of actions.
 *
 * @fires action-performed - is dispatched after each execution of an action.
 * @customElement
 * @demo demo/index.html
 */
export class AbstractAction extends foreElementMixin(HTMLElement) {
  static get properties() {
    return {
      ...super.properties,
      /**
       * detail - event detail object
       */
      detail: {
        type: Object,
      },
      /**
       * wether nor not an action needs to run the update cycle
       */
      needsUpdate: {
        type: Boolean,
      },
      /**
       * event to listen for
       */
      event: {
        type: Object,
      },
      /**
       * id of target element to attach listener to
       */
      target: {
        type: String,
      },
      /**
       * boolean XPath expression. If true the action will be executed.
       */
      ifExpr: {
        type: String,
      },
      /**
       * boolean XPath expression. If true loop will be executed. If an ifExpr is present this also needs to be true
       * to actually run the action.
       */
      whileExpr: {
        type: String,
      },
      /**
       * delay before executing action in milliseconds
       */
      delay: {
        type: Number,
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
      if (this.target === '#window') {
        window.addEventListener(this.event, e => this.execute(e));
      } else if (this.target === '#document') {
        document.addEventListener(this.event, e => this.execute(e));
      } else {
        this.targetElement = resolveId(this.target, this);
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
   * Will first evaluate ifExpr and continue only if it evaluates to 'true'. The 'whileExpr' will be executed
   * considering the delay if present.
   *
   * After calling `perform' which actually implements the semantics of an concrete action
   * `actionPerformed` will make sure that update cycle is run if 'needsUpdate' is true.
   *
   * @param e
   */
  async execute(e) {
    // console.log('executing', this);
    // console.log('executing e', e);
    // console.log('executing e phase', e.eventPhase);
    if(e && e.code){
      const vars = new Map();
      vars.set('code',e.code);
      this.setInScopeVariables(vars);
    }

    if (e && e.detail) {
      this.detail = e.detail;
      const vars = new Map();
      Object.keys(e.detail).forEach(function(key,index) {
        // key: the name of the object key
        // index: the ordinal position of the key within the object
        vars.set(key,e.detail[key]);
      });
      console.log("event detail vars", vars);
      this.setInScopeVariables(vars);
    }
    this.needsUpdate = false;

    this.evalInContext();
    if (this.targetElement && this.targetElement.nodeset) {
      this.nodeset = this.targetElement.nodeset;
    }

    // First check if 'if' condition is true - otherwise exist right away
    if (this.ifExpr && !evaluateXPathToBoolean(this.ifExpr, getInScopeContext(this), this)) {
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

        if (!evaluateXPathToBoolean(this.whileExpr, getInScopeContext(this), this)) {
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

  /**
   * calls the update cycle if action signalled that update is needed.
   */
  actionPerformed() {
    // console.log('actionPerformed action parentNode ', this.parentNode);
    if (this.needsUpdate) {
      const model = this.getModel();
      model.recalculate();
      model.revalidate();
      model.parentNode.refresh(true);
      this.dispatchActionPerformed();
    }
  }

  /**
   * dispathes action-performed event
   *
   * @event action-performed - whenever an action has been run
   */
  dispatchActionPerformed() {
    console.log('action-performed ', this);
    Fore.dispatch(this, 'action-performed', {});
  }
}

if (!customElements.get('abstract-action')) {
  window.customElements.define('abstract-action', AbstractAction);
}
