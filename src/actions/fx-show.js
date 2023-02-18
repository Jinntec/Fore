import { Fore } from '../fore.js';
import { FxAction } from './fx-action.js';
import { resolveId } from '../xpath-evaluation.js';

/**
 * `fx-confirm`
 * Displays a simple confirmation before actually executing the nested actions.
 *
 * @customElement
 * @demo demo/project.html
 */
export class FxShow extends FxAction {
  connectedCallback() {
    super.connectedCallback();
    this.dialog = this.getAttribute('dialog');
    if (!this.dialog) {
      Fore.dispatch(this, 'error', { message: 'dialog does not exist' });
    }
  }

  async perform() {
    const targetDlg = resolveId(this.dialog,this);
    if(!targetDlg){
      console.error('target dialog with given id does not exist',this.dialog);
    }
    targetDlg.open();
    Fore.dispatch(targetDlg,'dialog-shown',{});
  }
}

if (!customElements.get('fx-show')) {
  window.customElements.define('fx-show', FxShow);
}
