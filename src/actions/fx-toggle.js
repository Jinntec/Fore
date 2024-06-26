import { AbstractAction } from './abstract-action.js';
import { Fore } from '../fore';

/**
 * `fx-toggle`
 *
 */
class FxToggle extends AbstractAction {
  /*
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
*/
  connectedCallback() {
    super.connectedCallback();
    if (this.hasAttribute('case')) {
      this.case = this.getAttribute('case');
    }
  }

  async perform() {
    super.perform();
    if (this.case) {
      const ownerForm = this.getOwnerForm();
      // todo: id resolution!!!
      const caseElement = ownerForm.querySelector(`#${this.case}`);
      if (!caseElement) {
        Fore.dispatch(this, 'error', { message: `fx-case id not found: ${this.case}` });
        return;
      }
      const fxSwitch = caseElement.parentNode;
      fxSwitch.toggle(caseElement);
    }
    this.needsUpdate = true;
  }
}

if (!customElements.get('fx-toggle')) {
  window.customElements.define('fx-toggle', FxToggle);
}
