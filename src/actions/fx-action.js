import { AbstractAction } from './abstract-action.js';

/**
 * `fx-action`
 * an action to wrap other actions and defers the update cycle until the end of the block.
 *
 * @customElement
 * @demo demo/index.html
 */
export class FxAction extends AbstractAction {


  perform() {
    const {children} = this;
    Array.from(children).forEach(action => {
      action.perform();
    });
    this.needsUpdate = true;
  }

}

window.customElements.define('fx-action', FxAction);
