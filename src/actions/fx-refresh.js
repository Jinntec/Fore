import { AbstractAction } from './abstract-action.js';
import { Fore } from '../fore.js';
import {resolveId} from "../xpath-evaluation.js";
import {XPathUtil} from "../xpath-util.js";

/**
 * `fx-refresh`
 *
 * Calls refresh() on fx-form
 *
 */
class FxRefresh extends AbstractAction {
  async perform() {
    await this.dispatchEvent(
        new CustomEvent('execute-action', {
          composed: true,
          bubbles: true,
          cancelable:true,
          detail: { action: this, event:this.event},
        }),
    );

    if (this.hasAttribute('self')) {
      const control = XPathUtil.getClosest('fx-control', this);
      if (control) {
        await control.refresh();
        return;
      }
    }
    if(this.hasAttribute('force')){
      await this.getOwnerForm().forceRefresh();
      return;
    }
    if(this.hasAttribute('control')){
      const targetId = this.getAttribute('control');
      const ctrl = resolveId(targetId, this);
      if (ctrl && Fore.isUiElement(ctrl.nodeName) && typeof ctrl.refresh === 'function') {
        await ctrl.refresh();
      }
      return;
    }
    await this.getOwnerForm().refresh();
  }
}

if (!customElements.get('fx-refresh')) {
  window.customElements.define('fx-refresh', FxRefresh);
}
