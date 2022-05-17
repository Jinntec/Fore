import {Fore} from '../fore.js';
import {AbstractAction} from "./abstract-action.js";

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
      Fore.dispatch(this,'error',{message:'dialog does not exist'})
    }
  }

  perform() {
    document.getElementById(this.dialog).hide();
  }
}

window.customElements.define('fx-hide', FxHide);
