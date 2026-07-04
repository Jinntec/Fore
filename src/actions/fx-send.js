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
      this.getModel().updateModel();
      // todo: this bypasses observers...
      this.getOwnerForm().refresh(true); // whole instance changes - full refresh necessary
      // this.getOwnerForm().addToBatchedNotifications(this.getOwnerForm());
      // needsUpdate is set (below, via actionPerformed override) so the undo hook records
      // this replace as an undo step - it is NOT read by the default actionPerformed cycle
      // here, since that would run a second, redundant recalculate/revalidate/refresh(false)
      // on top of the full refresh(true) already done above
      this.needsUpdate = true;
    }
    // if not of type fx-submission signal error
  }

  actionPerformed() {
    // the instance-replace branch above already ran the full update+refresh cycle itself;
    // skip the default gated cycle (see the comment at the needsUpdate assignment) while
    // still calling dispatchActionPerformed() - the generic undo commit/discard hook in
    // _finalizePerform() runs independently of this override and needs nothing extra here
    this.dispatchActionPerformed();
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
