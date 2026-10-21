import { AbstractAction } from './abstract-action.js';
import { evaluateXPathToBoolean } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';

/**
 * `fx-action`
 * an action to wrap other actions and defers the update cycle until the end of the block.
 *
 * @customElement
 * @demo demo/index.html
 */
export class FxAction extends AbstractAction {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.src = this.hasAttribute('src') ? this.getAttribute('src') : null;
    const style = `
        :host{
            display:none;
        }
    `;
    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        <slot></slot>
    `;
  }

  /**
   * `fx-send` awaits the whole submission round trip, including `submit-done`/`submit-error`
   * handlers that may change the data a sibling `fx-send`'s `if` depends on. For a run of
   * consecutive `fx-send` siblings, all `if` conditions are therefore evaluated once, before the
   * first of them runs, so the branches are mutually exclusive when their conditions are.
   * Other actions keep evaluating `if` just before they run.
   *
   * @param {Element} current the child about to be executed
   */
  _evaluateSendConditionsUpFront(current) {
    if (current.localName !== 'fx-send') return;
    const previous = current.previousElementSibling;
    // only the first fx-send of a run triggers the evaluation for the whole run
    if (previous && previous.localName === 'fx-send') return;

    for (let send = current; send?.localName === 'fx-send'; send = send.nextElementSibling) {
      if (send.hasAttribute('if')) {
        try {
          send.evalInContext();
          // eslint-disable-next-line no-param-reassign
          send._precomputedIf = evaluateXPathToBoolean(
            send.getAttribute('if'),
            getInScopeContext(send),
            send,
          );
        } catch (error) {
          // let the action evaluate (and report) its own condition when it runs
          send._precomputedIf = undefined;
        }
      }
    }
  }

  async perform() {
    super.perform();
    const { children } = this;

    if (this.src) {
      this.innerHTML = ''; // reset
      const script = document.createElement('script');
      script.src = this.src;
      this.appendChild(script);
    } else {
      for (const actionOrVar of children) {
        this._evaluateSendConditionsUpFront(actionOrVar);
        if (actionOrVar.localName === 'fx-var') {
          // XForms 2.0: action variables are evaluated in sequence between sibling
          // actions, once per execution of the action content (per iteration when
          // `iterate`/`while` re-runs perform()).
          actionOrVar.refresh();
          // eslint-disable-next-line no-continue
          continue;
        }
        const action = actionOrVar;
        action.detail = this.detail;
        await action.execute();
      }
      // drop up-front results that were never consumed (e.g. the child returned early)
      Array.from(children).forEach(child => {
        if (child.localName === 'fx-send') child._precomputedIf = undefined; // eslint-disable-line no-param-reassign
      });
      this.dispatchActionPerformed();
      this.needsUpdate = true;
    }
  }
}

if (!customElements.get('fx-action')) {
  window.customElements.define('fx-action', FxAction);
}
