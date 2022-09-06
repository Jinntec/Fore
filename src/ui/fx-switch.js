import { Fore } from '../fore.js';
import { FxContainer } from './fx-container.js';

/**
 * `fx-switch`
 * a container allowing to switch between fx-case elements
 *
 *  * todo: implement
 * @customElement
 */
class FxSwitch extends FxContainer {
  /*
      constructor() {
        super();
        // this.attachShadow({ mode: 'open' });
      }
    */

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    const style = `
       :host ::slotted(fx-case.selected-case){
        display: block !important;
    }
    `;
    const html = `
       <slot></slot>
    `;
    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        ${html}
    `;
  }

  refresh(force) {
    super.refresh();
    console.log('refresh on switch ');
    const cases = this.querySelectorAll(':scope > fx-case');
    if (this.isBound()) {
      Array.from(cases).forEach(caseElem => {
        const name = caseElem.getAttribute('name');
        if (name === this.modelItem.value) {
          caseElem.classList.add('selected-case');
        } else {
          caseElem.classList.remove('selected-case');
        }
      });
    } else {
      const selected = this.querySelector(':scope > .selected-case');
      if (!selected) {
        cases[0].classList.add('selected-case');
      }
    }

    Fore.refreshChildren(this,force);
    // console.log('value ', this.value);
  }

  toggle(caseElement) {
    const cases = this.querySelectorAll('fx-case');
    Array.from(cases).forEach(c => {
      if (caseElement === c) {
        // eslint-disable-next-line no-param-reassign
        c.classList.add('selected-case');
      } else {
        // eslint-disable-next-line no-param-reassign
        c.classList.remove('selected-case');
      }
    });
  }
}

if (!customElements.get('fx-switch')) {
  window.customElements.define('fx-switch', FxSwitch);
}
