import { AbstractAction } from './abstract-action.js';
import { Fore } from '../fore.js';

/**
 * `fx-reload`
 * reloads browser window when receiving 'reload' event
 *
 * @event reload dispatched when action executes. Usually calls its own handler but might get cancelled by other handler.
 * @customElement
 * @demo demo/project.html
 */
export class FxReload extends AbstractAction {
  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.addEventListener(
      'reload',
      () => {
        window.location.reload();
      },
      { once: true },
    );
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

    Fore.dispatch(this, 'reload', {});
  }
}

if (!customElements.get('fx-reload')) {
  window.customElements.define('fx-reload', FxReload);
}
