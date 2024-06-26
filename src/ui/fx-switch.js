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
    this.selectedCase = null;
    this.cases = null;
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
    this.cases = [];
    this.formerCase = null;
    this.selectedCase = null;
  }

  async refresh(force) {
    super.refresh(force);
    // console.log('refresh on switch ');
    if (this.cases.length === 0) {
      this.cases = Array.from(this.querySelectorAll(':scope > fx-case'));
    }

    if (this.isBound()) {
      this._handleBoundSwitch();
    }
    if (!this.selectedCase) {
      this.selectedCase = this.cases[0]; // first is always default
      this.toggle(this.selectedCase);
    }

    Fore.refreshChildren(this.selectedCase, force);
  }

  _dispatchEvents() {
    if (this.formerCase && this.formerCase !== this.selectedCase) {
      Fore.dispatch(this.formerCase, 'deselect', {});
    }
    if (this.selectedCase.classList.contains('selected-case')) {
      Fore.dispatch(this.selectedCase, 'select', {});
    }
  }

  _resetVisited() {
    const visited = this.selectedCase.querySelectorAll('.visited');
    Array.from(visited).forEach(v => {
      v.classList.remove('visited');
    });
  }

  /**
   * handles switches being bound. If modelItem value matches the 'name' attribute that case will be toggled.
   * @private
   */
  _handleBoundSwitch() {
    Array.from(this.cases).forEach(caseElem => {
      const name = caseElem.getAttribute('name');
      if (name === this.modelItem?.value) {
        this.toggle(caseElem);
      }
    });
  }

  /**
   * Activates a fx-case element by switching CSS classes.
   * Dispatches 'select' and 'deselect' events as appropriate.
   *
   * @param caseElement the fx-case element to activate
   */
  toggle(caseElement) {
    this.selectedCase = caseElement;
    Array.from(this.cases).forEach(c => {
      if (c === this.selectedCase) {
        c.classList.remove('deselected-case');
        c.classList.add('selected-case');
        c.inert = false;
      } else {
        c.classList.remove('selected-case');
        c.classList.add('deselected-case');
        c.inert = true;
        this._resetVisited();
      }
    });

    if (this.selectedCase !== caseElement) {
      this.selectedCase = caseElement;
    }
    this._dispatchEvents();
    this.formerCase = this.selectedCase;

    // Tell the owner form we might have new template expressions here
    this.getOwnerForm().scanForNewTemplateExpressionsNextRefresh();
  }
}

if (!customElements.get('fx-switch')) {
  window.customElements.define('fx-switch', FxSwitch);
}
