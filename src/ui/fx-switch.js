import { Fore } from '../fore.js';
import { FxContainer } from './fx-container.js';

/**
 * `fx-switch`
 * a container allowing to switch between fx-case elements
 *
 * @customElement
 */
class FxSwitch extends FxContainer {
  /*
      constructor() {
        super();
        // this.attachShadow({ mode: 'open' });
      }
    */

  constructor() {
    super();
    this.formerCase = {};
  }
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
    let selectedCase = cases[0]; // first is always default
    if (this.isBound()) {
      Array.from(cases).forEach(caseElem => {
        const name = caseElem.getAttribute('name');
        if (name === this.modelItem?.value) {
          Fore.dispatch(caseElem,'select',{});
          caseElem.classList.add('selected-case');
          selectedCase = caseElem;
        } else {
          if(caseElem.classList.contains('selected-case')){
            Fore.dispatch(caseElem,'deselect',{});
          }
          caseElem.classList.remove('selected-case');
        }
      });
    } else {
      selectedCase = this.querySelector(':scope > .selected-case');
      // if none is selected select the first as default
      if (!selectedCase) {
        selectedCase = cases[0]; // if nothing is selected use the first case
        Fore.dispatch(selectedCase,'select',{});
        selectedCase.classList.add('selected-case');
      }
    }
    if(this.formerCase !== selectedCase){
      const visited = selectedCase.querySelectorAll('.visited');
      Array.from(visited).forEach(v =>{
        v.classList.remove('visited');
      });
    }

    Fore.refreshChildren(selectedCase,force);
    this.formerCase = selectedCase;
  }

  toggle(caseElement) {
    const cases = this.querySelectorAll('fx-case');
    Array.from(cases).forEach(c => {
      if (caseElement === c) {
        // eslint-disable-next-line no-param-reassign
        c.classList.add('selected-case');
        Fore.dispatch(c,'select',{});
        this.refresh();
      } else {
        // eslint-disable-next-line no-param-reassign
        if(c.classList.contains('selected-case')){
          Fore.dispatch(c,'deselect',{});
        }
        c.classList.remove('selected-case');
      }
    });
  }
}

if (!customElements.get('fx-switch')) {
  window.customElements.define('fx-switch', FxSwitch);
}
