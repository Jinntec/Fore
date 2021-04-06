import { FxAction } from './fx-action.js';

/**
 * `fx-toggle`
 *
 */
class FxToggle extends FxAction {
  connectedCallback() {
    if (this.hasAttribute('case')) {
      this.case = this.getAttribute('case');
    }
  }

  /*
    disconnectedCallback() {
        super.disconnectedCallback();
    }

*/
  execute() {
    console.log('### fx-toggle.execute ');
    if (this.case) {
      const ownerForm = this.getOwnerForm();
      const caseElement = ownerForm.querySelector(`#${this.case}`);
      const fxSwitch = caseElement.parentNode;
      fxSwitch.toggle(caseElement);
    }
  }
}

window.customElements.define('fx-toggle', FxToggle);
