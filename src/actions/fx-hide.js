import { Fore } from '../fore.js';
import { AbstractAction } from './abstract-action.js';
import { resolveId } from '../xpath-evaluation.js';

/**
 * `fx-hide`
 * hides a dialog
 *
 * @customElement
 * @demo demo/project.html
 */
export class FxHide extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      dialog: {
        type: String,
      },
    };
  }

  connectedCallback() {
    super.connectedCallback();
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

    const dialog = resolveId(this.dialog, this);
    dialog.hide();
    Fore.dispatch(dialog, 'dialog-hidden', {});
  }
}

if (!customElements.get('fx-hide')) {
  window.customElements.define('fx-hide', FxHide);
}
