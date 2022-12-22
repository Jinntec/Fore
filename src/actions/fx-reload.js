import { Fore } from '../fore.js';
import { AbstractAction } from './abstract-action.js';
import { resolveId } from '../xpath-evaluation.js';

/**
 * `fx-reload`
 * reloads browser window when receiving 'reload' event
 *
 * @event reload dispatched when action executes. Usually calls its own handler but might get cancelled by other handler.
 * @customElement
 * @demo demo/project.html
 */
export class FxReload extends AbstractAction {

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('reload', event => {
      window.location.reload();
    },{once:true});
  }

  async perform() {
    Fore.dispatch(this, 'reload', {});
  }
}

if (!customElements.get('fx-reload')) {
  window.customElements.define('fx-reload', FxReload);
}

