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

  async refresh(force) {
    super.refresh();
    // console.log('refresh on switch ');
    const cases = this.querySelectorAll(':scope > fx-case');
    let selectedCase;
    if (this.isBound()) {
      Array.from(cases).forEach(caseElem => {
        const name = caseElem.getAttribute('name');
        if (name === this.modelItem.value) {
          caseElem.classList.add('selected-case');
          selectedCase = caseElem;
        } else {
          caseElem.classList.remove('selected-case');
        }
      });
    } else {
      selectedCase = this.querySelector(':scope > .selected-case');
      // if none is selected select the first as default
      if (!selectedCase) {
        selectedCase = cases[0];
        selectedCase.classList.add('selected-case');
      }
    }

    Fore.refreshChildren(selectedCase,force);
  }

  toggle(caseElement) {
    const cases = this.querySelectorAll('fx-case');
    Array.from(cases).forEach(c => {
      if (caseElement === c) {
        // eslint-disable-next-line no-param-reassign
        c.classList.add('selected-case');
        this.refresh();
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
