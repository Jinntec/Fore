import '../fx-model.js';
import { AbstractAction } from './abstract-action.js';
import { evaluateXPath, evaluateXPathToString } from '../xpath-evaluation.js';
import { Fore } from '../fore';
import getInScopeContext from '../getInScopeContext';
import { XPathUtil } from '../xpath-util.js';

/**
 * `fx-call`
 *
 * @customElement
 */
export default class FxCall extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      action: {
        type: String,
      },
      fn: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.action = '';
    this.fn = '';
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    if (this.hasAttribute('action')) {
      this.action = this.getAttribute('action');
    } else if (this.hasAttribute('function')) {
      this.fn = this.getAttribute('function');
    } else {
      throw new Error('fx-call must specify an "action" or "function" attribute');
    }
  }

  async perform() {
    super.perform();
    if (this.action) {
      await this._callAction();
    }
    // execute function
    if (this.fn) {
      this._callFunction();
    }
  }

  /**
   * find action and execute it
   */
  async _callAction() {
    const action = document.querySelector(`#${this.action}`);
    if (action) {
      await action.perform();
    } else {
      Fore.dispatch(this, 'error', {
        origin: this,
        message: `Action '${this.action}' not found`,
        expr: XPathUtil.getDocPath(this),
        level: 'Error',
      });
    }
  }

  _callFunction() {
    const inscope = getInScopeContext(this, 'instance()', this);
    evaluateXPath(this.fn, inscope, this);
  }
}

if (!customElements.get('fx-call')) {
  window.customElements.define('fx-call', FxCall);
}
