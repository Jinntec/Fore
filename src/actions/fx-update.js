import { AbstractAction } from './abstract-action.js';

/**
 * `fx-update`
 *
 * Calls updateModel() on fx-model which in turn will rebuild, recalculate and revalidate.
 *
 */
class FxUpdate extends AbstractAction {
  async perform() {
    this.getModel().updateModel();
  }
}

if (!customElements.get('fx-update')) {
  window.customElements.define('fx-update', FxUpdate);
}
