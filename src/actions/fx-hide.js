import { FxAction } from './fx-action.js';

/**
 * `fx-hide`
 * hides a dialog
 *
 * @customElement
 * @demo demo/project.html
 */
export class FxHide extends FxAction {
  connectedCallback() {
    this.dialog = this.getAttribute('dialog');
    if(!this.dialog){
      this.dispatch('error',{message:'dialog does not exist'})
    }
  }

  perform() {
    document.getElementById(this.dialog).classList.remove('show');
  }
}

window.customElements.define('fx-hide', FxHide);
