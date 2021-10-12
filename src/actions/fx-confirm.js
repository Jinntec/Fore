import {FxAction} from "./fx-action.js";

/**
 * `fx-confirm`
 * Displays a simple confirmation before actually executing the nested actions.
 *
 * @customElement
 * @demo demo/project.html
 */
export class FxConfirm extends FxAction {
  connectedCallback() {
    this.message = this.hasAttribute('message') ? this.getAttribute('message') : null;
  }

  perform() {
    if(window.confirm(this.message)){
      super.perform();
    }
  }
}

window.customElements.define('fx-confirm', FxConfirm);
