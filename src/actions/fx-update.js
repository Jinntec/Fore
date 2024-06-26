import { AbstractAction } from './abstract-action.js';

/**
 * `fx-update`
 *
 * Calls updateModel() on fx-model which in turn will rebuild, recalculate and revalidate.
 *
 */
class FxUpdate extends AbstractAction {
  async perform() {
    this.dispatchEvent(
      new CustomEvent('execute-action', {
        composed: true,
        bubbles: true,
        cancelable: true,
        detail: { action: this, event: this.event },
      }),
    );

    this.getModel().updateModel();
  }
}

if (!customElements.get('fx-update')) {
  window.customElements.define('fx-update', FxUpdate);
}
