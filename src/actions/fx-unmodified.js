import { AbstractAction } from './abstract-action.js';

/**
 * `fx-unmodified`
 *
 * @customElement
 */
export default class FxUnmodified extends AbstractAction {
  constructor() {
    super();
  }

  async perform() {
    this.getOwnerForm().markAsClean();
  }
}

if (!customElements.get('fx-unmodified')) {
  window.customElements.define('fx-unmodified', FxUnmodified);
}
