import { AbstractAction } from './abstract-action.js';

/**
 * `fx-update`
 *
 * Calls updateModel() on fx-model which in turn will rebuild, recalculate and revalidate.
 *
 */
class FxUpdate extends AbstractAction {

  perform() {
    this.getModel().updateModel();
  }

}

window.customElements.define('fx-update', FxUpdate);
