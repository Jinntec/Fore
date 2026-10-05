import '../fx-model.js';
import '../fx-submission.js';
import { AbstractAction } from './abstract-action.js';
import { getDocPath } from '../xpath-path.js';

/**
 * `fx-send` - finds and activates a `fx-submission` or a `fx-connection` element.
 *
 * @customElement
 */
class FxSend extends AbstractAction {
  constructor() {
    super();
    this.value = '';
    this.url = null;
    this.target = null;
    // set in perform() when a replace="instance" response landed while inside an action
    // chain; consumed in actionPerformed() - see there.
    this._deferInstanceReplaceUpdate = false;
  }

  connectedCallback() {
    // eslint-disable-next-line wc/guard-super-call
    super.connectedCallback();
    // console.log('connectedCallback ', this);
    this.submission = this.getAttribute('submission');
    this.url = this.hasAttribute('url') ? this.getAttribute('url') : null;
    this.target = this.hasAttribute('target') ? this.getAttribute('target') : null;
    this.connection = this.hasAttribute('connection') ? this.getAttribute('connection') : null;
  }

  async perform() {
    super.perform();

    // reset CSS class that signalled validation error during last submit
    this.getOwnerForm().classList.remove('submit-validation-failed');

    if (this.connection) {
      const connectionElement = this.getModel().querySelector(`#${this.connection}`);
      if (connectionElement === null) {
        this.dispatchEvent(
          new CustomEvent('error', {
            composed: false,
            bubbles: true,
            cancelable: true,
            detail: {
              id: this.id,
              origin: this,
              message: `<fx-connection id="${this.connection}"> not found`,
              expr: getDocPath(this),
              level: 'Error',
            },
          }),
        );
        return;
      }
      this._emitToChannel();
      return;
    }

    const submission = this.getModel().querySelector(`#${this.submission}`);
    if (submission === null) {
      this.dispatchEvent(
        new CustomEvent('error', {
          composed: false,
          bubbles: true,
          cancelable: true,
          detail: {
            id: this.id,
            origin: this,
            message: `<fx-submission id="${this.submission}"> not found`,
            expr: getDocPath(this),
            level: 'Error',
          },
        }),
      );
      return;

      // throw new Error(`submission with id: ${this.submission} not found`);
    }
    // console.log('submission', submission);

    if (this.url) {
      const resolved = this.evaluateAttributeTemplateExpression(this.url, this);
      submission.parameters.set('url', resolved);
    }
    if (this.target) {
      const resolved = this.evaluateAttributeTemplateExpression(this.target, this);
      submission.parameters.set('target', resolved);
    }

    await submission.submit();
    if (submission.replace === 'instance') {
      // Mark the replace as an undo step (the hook in _finalizePerform() reads needsUpdate).
      this.needsUpdate = true;

      if (submission._updateCycleDeferredToChain) {
        // _handleResponse() replaced an instance while running inside this action chain and
        // handed the update cycle to us: own it from actionPerformed(), which fires AFTER
        // the submit-done / submit-error child actions so their model changes are folded
        // into the same rebuild/recalculate (issue #373).
        submission._updateCycleDeferredToChain = false;
        this._deferInstanceReplaceUpdate = true;
      } else if (!this.getModel().inited) {
        // Model never came up during submit(), so _handleResponse() skipped its
        // inited-guarded cycle and nothing else will run one - do it here.
        this.getModel().updateModel();
        this.getOwnerForm().refresh(true); // whole instance changed - full refresh
      }
      // else (submit-error / validation failure / stub): nothing was swapped, so no
      // rebuild is owed; super.actionPerformed() still runs the normal light cycle.
    }
    // if not of type fx-submission signal error
  }

  actionPerformed() {
    // A replace="instance" response swaps a whole instance root; like fx-reset / fx-replace,
    // fx-send owns the model update cycle for it. Running it HERE (not inside
    // fx-submission#_handleResponse()) means the submit-done / submit-error child actions
    // have already executed and recorded their model changes, so a full recalculate folds
    // them in - previously those changes were stranded and dependent facets
    // (relevant/readonly/calculate) never recomputed (issue #373).
    if (this._deferInstanceReplaceUpdate) {
      this._deferInstanceReplaceUpdate = false;
      const model = this.getModel();
      model.changed = []; // whole instance replaced - recompute the full graph
      model.updateModel();
      this.getOwnerForm().refresh(true);
      this.dispatchActionPerformed();
      return;
    }
    // submit-error / validation failure / non-instance replace: nothing was swapped, so no
    // rebuild is owed here. A submit-done / submit-error child action's own model change
    // (if any) still gets flushed through the normal deferred-update path.
    super.actionPerformed();
  }

  _emitToChannel() {
    const channel = this.getModel().querySelector(`#${this.connection}`);
    if (channel === null) {
      return;
    }
    channel.send();
  }
}

if (!customElements.get('fx-send')) {
  window.customElements.define('fx-send', FxSend);
}
