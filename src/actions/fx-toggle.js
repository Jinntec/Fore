import { AbstractAction } from './abstract-action.js';

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

  perform() {
    super.perform();
    console.log('### fx-toggle.execute ');
    if (this.case) {
      const ownerForm = this.getOwnerForm();
      const caseElement = ownerForm.querySelector(`#${this.case}`);
      const fxSwitch = caseElement.parentNode;
      fxSwitch.toggle(caseElement);
    }
    // this.needsUpdate = true;

  }

}

if (!customElements.get('fx-toggle')) {
  window.customElements.define('fx-toggle', FxToggle);
}