import { FxAction } from './fx-action.js';
import {AbstractAction} from "./abstract-action";

/**
 * `fx-hide`
 * hides a dialog
 *
 * @customElement
 * @demo demo/project.html
 */
export class FxHide extends AbstractAction {
  connectedCallback() {
    this.dialog = this.getAttribute('dialog');
    if(!this.dialog){
      this.dispatch('error',{message:'dialog does not exist'})
    }
  }

  perform() {
    document.getElementById(this.dialog).hide();
  }
}

window.customElements.define('fx-hide', FxHide);
