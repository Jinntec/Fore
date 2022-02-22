import { FxAction } from './fx-action.js';

/**
 * `fx-confirm`
 * Displays a simple confirmation before actually executing the nested actions.
 *
 * @customElement
 * @demo demo/project.html
 */
export class FxShow extends FxAction {
  connectedCallback() {
    this.dialog = this.getAttribute('dialog');
    if(!this.dialog){
      this.dispatch('error',{message:'dialog does not exist'})
    }
  }

  perform() {
    document.getElementById(this.dialog).classList.add('show');
  }
}

window.customElements.define('fx-show', FxShow);
