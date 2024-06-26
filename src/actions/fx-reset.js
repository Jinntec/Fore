import { Fore } from '../fore.js';
import { AbstractAction } from './abstract-action.js';

/**
 * `fx-reset`
 * resets an instance to use inline template data
 *
 * @customElement
 * @demo demo/project.html
 */
export class FxReset extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      instance: {
        type: String,
      },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.instance = this.getAttribute('instance');
    if (!this.instance) {
      Fore.dispatch(this, 'error', { message: 'instance does not exist' });
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

    const model = this.getModel();
    const data = model.getInstance(this.instance);
    data.reset();
    this.needsUpdate = true;
  }
}

if (!customElements.get('fx-reset')) {
  window.customElements.define('fx-reset', FxReset);
}
