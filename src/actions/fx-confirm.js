import { FxAction } from './fx-action.js';

/**
 * `fx-confirm`
 * Displays a simple confirmation before actually executing the nested actions.
 *
 * @customElement
 * @demo demo/project.html
 */
export class FxConfirm extends FxAction {
  static get properties() {
    return {
      ...FxAction.properties,
      message: {
        type: String,
      },
    };
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.message = this.hasAttribute('message') ? this.getAttribute('message') : null;
  }

  async perform() {
    if (window.confirm(this.message)) {
      await super.perform();
    }
  }
}

if (!customElements.get('fx-confirm')) {
  window.customElements.define('fx-confirm', FxConfirm);
}
