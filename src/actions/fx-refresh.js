import { AbstractAction } from './abstract-action.js';
import { Fore } from '../fore.js';
import {resolveId} from "../xpath-evaluation";

/**
 * `fx-refresh`
 *
 * Calls refresh() on fx-form
 *
 */
class FxRefresh extends AbstractAction {
  perform() {
    if (this.hasAttribute('self')) {
      const control = Fore.getClosest('fx-control', this);
      if (control) {
        control.refresh();
        return;
      }
    }
    if(this.hasAttribute('force')){
      this.getOwnerForm().forceRefresh();
      return;
    }
    if(this.hasAttribute('control')){
      const targetId = this.getAttribute('control');
      const ctrl = resolveId(targetId, this);
      if (Fore.isUiElement(ctrl.nodeName) && typeof ctrl.refresh === 'function') {
        ctrl.refresh();
      }
      return;
    }
    this.getOwnerForm().refresh();
  }
}

if (!customElements.get('fx-refresh')) {
  window.customElements.define('fx-refresh', FxRefresh);
}
