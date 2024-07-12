import { Fore } from '../fore.js';
import { FxAction } from './fx-action.js';
import { resolveId } from '../xpath-evaluation.js';

/**
 * `fx-show`
 * Displays a simple confirmation before actually executing the nested actions.
 *
 * @customElement
 * @event fx-show dispatched when dialog is shown
 */
export class FxShow extends FxAction {
  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.dialog = this.getAttribute('dialog');
    if (!this.dialog) {
      Fore.dispatch(this, 'error', { message: 'dialog does not exist' });
    }
  }

  async perform() {
    this.dispatchEvent(
      new CustomEvent('execute-action', {
        composed: true,
        bubbles: true,
        cancelable: true,
        detail: { action: this, event: this.event },
      }),
    );

    const targetDlg = resolveId(this.dialog, this);
    if (!targetDlg) {
      console.error('target dialog with given id does not exist', this.dialog);
    }
    targetDlg.open();
    Fore.dispatch(targetDlg, 'dialog-shown', {});
  }
}

if (!customElements.get('fx-show')) {
  window.customElements.define('fx-show', FxShow);
}
