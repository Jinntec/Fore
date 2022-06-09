import { AbstractAction } from './abstract-action.js';

/**
 * `fx-refresh`
 *
 * Calls refresh() on fx-form
 *
 */
class FxRefresh extends AbstractAction {
  perform() {
    if (this.hasAttribute('self')) {
      const control = this.closest('fx-control');
      if (control) {
        control.refresh();
        return;
      }
    }
    this.getOwnerForm().refresh();
  }
}

window.customElements.define('fx-refresh', FxRefresh);
