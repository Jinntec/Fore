import { AbstractAction } from './abstract-action.js';

/**
 * `fx-refresh`
 *
 * Calls refresh() on fx-form
 *
 */
class FxRefresh extends AbstractAction {

  perform() {
    this.getOwnerForm().refresh();
  }

}

window.customElements.define('fx-refresh', FxRefresh);
