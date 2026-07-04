import ForeElementMixin from '../ForeElementMixin.js';
import { evaluateXPathToBoolean, resolveId, evaluateXPath } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
import { Fore } from '../fore.js';
import { FxFore } from '../fx-fore.js';
import { XPathUtil } from '../xpath-util.js';
import { getDocPath } from '../xpath-path.js';

/**
 * @param {number} howLong How long to wait, in ms
 * @returns {Promise<void>}
 */
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
export class AbstractAction extends ForeElementMixin {
  static dataChanged = false;

  static get properties() {
    return {
      ...super.properties,
      /**
       * can be either 'cancel' or 'perform' (default)
       */
      defaultAction: {
        type: String,
      },
      /**
       * delay before executing action in milliseconds
       */
      delay: {
        type: Number,
      },
      /**
       * detail - event detail object
       */
      detail: {
        type: Object,
      },
      /**
       * event to listen for
       */
      event: {
        type: Object,
      },
      handler: {
        type: Object,
      },
      /**
       * boolean XPath expression. If true the action will be executed.
       */
      ifExpr: {
        type: String,
      },
      /**
       * The iterate attribute can be added to any XForms action. It contains an expression
       * that is evaluated once using the in-scope evaluation context before the action is
       * executed, which will result in a sequence of items. The action will be executed with
       * each item in the sequence as its context. This context replaces the default in scope
       * evaluation context.
       *
       * The interaction with `@while` and `@if` is undefined.
       */
      iterateExpr: {
        type: String,
      },
      /**
       * whether nor not an action needs to run the update cycle
       */
      needsUpdate: {
        type: Boolean,
      },
      /**
       * The observer if given is the element on which an event is triggered. It must be an ancestor of the target
       * element of an event.
       */
      observer: {
        type: Object,
      },
      /**
       * can be either 'capture' or 'default' (default)
       */
      phase: {
        type: String,
      },
      /**
       * can be either 'stop' or 'continue' (default)
       */
      propagate: {
        type: String,
      },
      /**
       * id of target element to attach listener to
       */
      target: {
        type: String,
      },
      /**
       * boolean XPath expression. If true loop will be executed. If an ifExpr is present this
       * also needs to be true to actually run the action.
       */
      whileExpr: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.detail = {};
    this.needsUpdate = false;
  }

  disconnectedCallback() {}

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('inert', 'true');
    this.style.display = 'none';
    this.propagate = this.hasAttribute('propagate') ? this.getAttribute('propagate') : 'continue';
    this.repeatContext = undefined;

    if (this.hasAttribute('event')) {
      this.event = this.getAttribute('event');
    }
    if (this.hasAttribute('defaultAction')) {
      this.defaultAction = this.getAttribute('defaultAction');
    } else {
      this.defaultAction = 'perform';
    }
    if (this.hasAttribute('phase')) {
      this.phase = this.getAttribute('phase');
    } else {
      this.phase = 'default';
    }

    /*
            this.addEventListener('click', e => {
              e.preventDefault();
              e.stopPropagation();
            });
        */

    this.ifExpr = this.hasAttribute('if') ? this.getAttribute('if') : null;
    this.whileExpr = this.hasAttribute('while') ? this.getAttribute('while') : null;
    this.delay = this.hasAttribute('delay') ? Number(this.getAttribute('delay')) : 0;
    this.iterateExpr = this.hasAttribute('iterate') ? this.getAttribute('iterate') : null;

    this._addUpdateListener();
  }

  _addUpdateListener() {
    this.target = this.getAttribute('target');
    if (this.target) {
      if (this.target === '#window') {
        window.addEventListener(this.event, e => this.execute(e), {
          capture: this.phase === 'capture',
        });
      } else if (this.target === '#document') {
        document.addEventListener(this.event, e => this.execute(e), {
          capture: this.phase === 'capture',
        });
      } else {
        this.targetElement = resolveId(this.target, this);
        if (!this.targetElement) return; // does not or does not yet exist
        this?.targetElement.addEventListener(this.event, e => this.execute(e), {
          capture: this.phase === 'capture',
        });
      }
    } else {
      this.targetElement = this.parentNode;
      if (!this.targetElement || this.targetElement.nodeType !== Node.ELEMENT_NODE) return;
      this.targetElement.addEventListener(this.event, e => this.execute(e), {
        capture: this.phase === 'capture',
      });
      // console.log('adding listener for ', this.event , ` to `, this);
    }
  }

  getActionDebugDetail(extra = {}) {
    const getAttr = name => {
      try {
        return this.getAttribute(name) || null;
      } catch (error) {
        return null;
      }
    };

    return {
      action: this.localName || null,
      actionClass: this.constructor?.name || null,
      id: this.id || null,
      event: this.event || null,
      ref: getAttr('ref'),
      target: getAttr('target'),
      origin: getAttr('origin'),
      submission: getAttr('submission'),
      control: getAttr('control'),
      if: getAttr('if'),
      while: getAttr('while'),
      iterate: getAttr('iterate'),
      delay: this.delay || 0,
      needsUpdate: this.needsUpdate,
      ownerFore: this.getOwnerFormSafe()?.id || null,
      ...extra,
    };
  }

  dispatchActionDebugEvent(type, extra = {}) {
    try {
      const target = this.isConnected ? this : (this.getOwnerFormSafe() ?? this);
      target.dispatchEvent(
          new CustomEvent(type, {
            composed: true,
            bubbles: true,
            cancelable: false,
            detail: this.getActionDebugDetail(extra),
          }),
      );
    } catch (error) {
      // Debug events must never affect action execution.
    }
  }

  getOwnerFormSafe() {
    try {
      return this.getOwnerForm?.() || null;
    } catch (error) {
      return null;
    }
  }

  async performSafe() {
    let success = false;

    this.dispatchActionDebugEvent('action-start', {
      phase: 'start',
    });

    try {
      await this.perform();
      success = true;
      return true;
    } catch (error) {
      await Fore.dispatch(this, 'error', {
        origin: this,
        message: 'Action execution failed',
        expr: error,
        level: 'Error',
      });

      return false;
    } finally {
      this.dispatchActionDebugEvent('action-end', {
        phase: 'end',
        success,
      });
    }
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
    if (!this.getModel().modelConstructed) return;
    // console.log(this, this.event);
    if (this.event) {
      if (this.event === 'submit-done') {
        console.info(`📌 ${this.event} #${this?.parentNode?.id}`);
      } else {
        console.info(`📌 ${this.constructor.name} ${this.event}`);
      }
    } else {
      console.info(
        `%cexecuting ${this.constructor.name}`,
        'background:limegreen; color:black; margin-left:1rem; padding:.5rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;width:100%;',
        this,
      );
    }

    if (e && e.target.nodeType !== Node.DOCUMENT_NODE && e.target !== window) {
      /*
             ### ignore event if there's a parent fore and the current element is NOT part of it. This avoids
             ### an event to fire twice on an inner one and the surrounding one(s).
             ### e.target might be outside an fx-fore element and shouldn't get cancelled in that case.
            */
      if (e.target.closest('fx-fore') && e.target.closest('fx-fore') !== this.closest('fx-fore')) {
        // Event originates from a sub-component. Ignore it!
        // No need to stop propagation. All other listeners will also ignore it from here
        return;
      }
    }

    if (this.propagate === 'stop') {
      // console.log('event propagation stopped', e)
      e.stopPropagation();
    }
    if (this.defaultAction === 'cancel') {
      e.preventDefault();
    }

    let resolveThisEvent = () => {};
    if (e && e.listenerPromises) {
      e.listenerPromises.push(
        new Promise(resolve => {
          resolveThisEvent = resolve;
        }),
      );
    }

    // Outermost handling
    // NOTE: kept as a local variable, not `this._acquiredOutermost` - action elements are
    // singletons reused across clicks, so two overlapping execute() calls on the same
    // element (rapid double-click) would otherwise clobber each other's flag and strand
    // FxFore.outermostHandler or skip the undo commit in _finalizePerform().
    const acquiredOutermost = FxFore.outermostHandler === null;
    if (acquiredOutermost) {
      const ownerForm = this.getOwnerFormSafe();

      console.log(
        `%coutermost Action on ${ownerForm?.id || ''}`,
        'background:darkblue; color:white; padding:0.3rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;',
        this,
      );

      FxFore.outermostHandler = this;
      this.getModel()?.getEffectiveUndoManager()?.beginCapture();
      this.dispatchEvent(
        new CustomEvent('outermost-action-start', {
          composed: true,
          bubbles: true,
          cancelable: true,
          detail: { cause: e?.type },
        }),
      );
    }

    if (e) {
      this.currentEvent = e;
    }
    this.needsUpdate = false;

    try {
      this.evalInContext();
    } catch (error) {
      console.warn('evaluation failed', error);
    }
    if (this.targetElement && this.targetElement.nodeset) {
      this.nodeset = this.targetElement.nodeset;
    }

    // Order of application between if / while and iterate is undefined. See
    // https://www.w3.org/MarkUp/Forms/wiki/@iterate
    if (this.iterateExpr) {
      // Same as whileExpr, let it go update UI afterwards
      await this.handleIterateExpr();
      this._finalizePerform(resolveThisEvent, acquiredOutermost);
      return;
    }

    // Check if 'if' condition is true - otherwise exist right away
    if (this.ifExpr && !evaluateXPathToBoolean(this.ifExpr, getInScopeContext(this), this)) {
      this._finalizePerform(resolveThisEvent, acquiredOutermost);
      return;
    }

    if (this.whileExpr) {
      // After loop is done call actionPerformed to update the model and UI
      await this.handleWhileExpr();
      this._finalizePerform(resolveThisEvent, acquiredOutermost);
      return;
    }

    if (this.delay) {
      // Delay further execution until the delay is done
      await wait(this.delay);
      const ownerForm = this.getOwnerFormSafe();
      if (!ownerForm || !XPathUtil.contains(ownerForm, this)) {
        // We are no longer in the document. Stop working
        this.actionPerformed();
        resolveThisEvent();
        return;
      }
    }

    await this.performSafe();
    this._finalizePerform(resolveThisEvent, acquiredOutermost);
  }

  async handleWhileExpr() {
    // While: while the condition is true, delay a bit and execute the action
    // Start by waiting
    await wait(this.delay || 0);

    const ownerForm = this.getOwnerFormSafe();
    if (!ownerForm || !XPathUtil.contains(ownerForm, this)) {
      // We are no longer in the document. Stop working
      return;
    }

    if (!evaluateXPathToBoolean(this.whileExpr, getInScopeContext(this), this)) {
      // Done with iterating
      return;
    }

    // Perform the action once. But quit if it failed
    if (!(await this.performSafe())) {
      return;
    }

    // Go for one more iteration
    if (this.delay) {
      // If we have a delay, fire and forget this.
      // Otherwise, if we have no delay, keep waiting for all iterations to be done.
      // The while is then uninterruptable and immediate

      this.handleWhileExpr();
      return;
    }

    await this.handleWhileExpr();
  }

  async handleIterateExpr() {
    try {
      // Iterate: get the context sequence and perform the action once per item.
      const contextSequence = evaluateXPath(this.iterateExpr, getInScopeContext(this), this);

      if (contextSequence.length === 0) {
        return;
      }

      const ownerForm = this.getOwnerFormSafe();
      if (!ownerForm || !XPathUtil.contains(ownerForm, this)) {
        // We are no longer in the document. Stop working
        return;
      }

      for (const item of contextSequence) {
        if (this.delay) {
          await wait(this.delay || 0);
        }

        // This will be picked up in `getInscopeContext`
        this.currentContext = item;

        // Perform the action once. But quit if it failed
        if (!(await this.performSafe())) {
          return;
        }
      }
    } finally {
      this.currentContext = null;
    }
  }

  _finalizePerform(resolveThisEvent, acquiredOutermost) {
    this.currentEvent = null;
    // capture before actionPerformed() - overrides may consume or propagate needsUpdate
    const changed = this.needsUpdate;
    this.actionPerformed();
    // decide on the acquiredOutermost param (captured locally in execute()), not on the
    // static: actionPerformed()'s stale-handler check nulls FxFore.outermostHandler when
    // this action removed itself from the document (e.g. fx-delete inside the repeat item
    // it deletes) - a local var also survives a second, overlapping execute() call on the
    // same (singleton, reused) action element clobbering shared instance state
    if (acquiredOutermost) {
      const undoManager = this.getModel()?.getEffectiveUndoManager();
      if (undoManager) {
        if (changed) {
          undoManager.commit(this._getCoalesceKey());
        } else {
          undoManager.discard();
        }
      }

      // Defensive re-check: actionPerformed()'s stale-handler recovery (above) can have
      // already nulled FxFore.outermostHandler and let a *different* action acquire it
      // before we get here - only clear/dispatch if it's still pointing at us.
      if (FxFore.outermostHandler === this) {
        const ownerForm = this.getOwnerFormSafe();

        console.log(
          `%cfinalizing outermost Action on ${ownerForm?.id || ''}`,
          'background:darkblue; color:white; padding:0.3rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;',
          this,
        );

        FxFore.outermostHandler = null;
        /*
                          console.info(
                              `%coutermost Action done`,
                              'background:#e65100; color:white; padding:0.3rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;',
                              this,
                          );
                          console.timeEnd('outermostHandler');
              */
        this.dispatchEvent(
          new CustomEvent('outermost-action-end', {
            composed: true,
            bubbles: true,
            cancelable: true,
          }),
        );
      }
    }
    resolveThisEvent();
  }

  /**
   * Template method to be implemented by each action that is called by execute() as part of
   * the processing.
   *
   * This function should not called on any action directly - call execute() instead to ensure proper execution of 'if' and 'while'.
   *
   * TODO Fore DevTools:
   * Concrete actions overriding perform() should call `await super.perform()` at the start.
   * Otherwise the debugger will not see the `execute-action` event for that action.
   */
  async perform() {
    if (this.isBound() || this.nodeName === 'FX-ACTION') {
      this.evalInContext();
    }

/*
    await Fore.dispatch(this, 'execute-action', this.getActionDebugDetail({
      phase: 'before',
    }));
*/
  }

  /**
   * Best-effort identification of the data node this action touched, used by the
   * UndoManager to merge rapid successive edits of the same node into one undo step.
   *
   * Falls back to the raw `ref` string when no node was resolved (e.g. fx-insert),
   * which may coalesce same-ref edits across different repeat items within the window.
   */
  _getCoalesceKey() {
    const miNode = this.modelItem?.node;
    if (miNode) return Array.isArray(miNode) ? miNode[0] : miNode;
    if (this.nodeset) return Array.isArray(this.nodeset) ? this.nodeset[0] : this.nodeset;
    return this.getAttribute('ref');
  }

  /**
   * calls the update cycle if action signalled that update is needed.
   */
  actionPerformed() {
    const model = this.getModel();
    if (!model) {
      return;
    }
    if (!model.inited) {
      return;
    }
    if (
      FxFore.outermostHandler &&
      !XPathUtil.contains(FxFore.outermostHandler.ownerDocument, FxFore.outermostHandler)
    ) {
      // The old outermostHandler fell out of the document. An error has happened.
      // Just remove the old one and act like we are starting anew.
      // console.warn('Unsetting outermost handler');
      FxFore.outermostHandler = null;
    }
    // console.log('actionPerformed action parentNode ', this.parentNode);
    if (this.needsUpdate && (FxFore.outermostHandler === this || !FxFore.outermostHandler)) {
      // console.log('running update cycle for outermostHandler', this);
      model.recalculate();
      model.revalidate();
      const ownerForm = this.getOwnerFormSafe();
      ownerForm?.refresh(false);
      this.dispatchActionPerformed();
    } else if (this.needsUpdate) {
      // console.log('Update delayed!');
      // We need an update, but the outermost action handler is not done yet. Make this clear!
      // console.log('running actionperformed on', this, ' to be updated by ', FxFore.outermostHandler);
      FxFore.outermostHandler.needsUpdate = true;
    }

    // console.log('running actionperformed on', this, ' outermostHandler', FxFore.outermostHandler);
  }

  /**
   * dispatches action-performed event
   *
   * @event action-performed - whenever an action has been run
   */
  dispatchActionPerformed() {
    Fore.dispatch(this, 'action-performed', this.getActionDebugDetail({
      phase: 'after',
    }));
  }
}

if (!customElements.get('abstract-action')) {
  window.customElements.define('abstract-action', AbstractAction);
}
