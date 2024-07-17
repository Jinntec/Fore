import { AbstractAction } from './abstract-action.js';
import { FxAction } from './fx-action.js';
import { Fore } from '../fore.js';

/**
 * `fx-action`
 * an action to wrap other actions and defers the update cycle until the end of the block.
 *
 * @customElement
 * @demo demo/index.html
 */
export class FxConstructDone extends FxAction {
  connectedCallback() {
    // eslint-disable-next-line wc/guard-super-call
    super.connectedCallback();
    console.log('parentNode', this.parentNode);
    if (this.parentNode.nodeName !== 'FX-MODEL') {
      Fore.dispatch(this, 'error', { message: 'parent is not a model' });
      return;
    }
    this.parentNode.addEventListener('model-construct-done', e => {
      super.perform();
    });
  }
}
if (!customElements.get('fx-construct-done')) {
  window.customElements.define('fx-construct-done', FxConstructDone);
}
