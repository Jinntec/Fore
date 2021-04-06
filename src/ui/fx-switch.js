import { foreElementMixin } from '../ForeElementMixin.js';

/**
 * `fx-switch`
 * a container allowing to switch between fx-case elements
 *
 *  * todo: implement
 * @customElement
 */
class FxSwitch extends foreElementMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (this.hasAttribute('ref')) {
      this.ref = this.getAttribute('ref');
    }

    const style = `
            :host {
                display: block;
            }
            :host ::slotted(fx-case){
                display:none;
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

    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', event => {
      console.log('fx-switch slotchange ', event.target.assignedElements());
      const cases = event.target.assignedElements();
      console.log('fx-switch slotchange ', cases[0]);
      cases[0].style.display = 'block';
    });
  }

  refresh() {
    console.log('refresh on switch ');
    if (this.ref) {
      this.evalInContext();
      this.modelItem = this.getModelItem();
      this.value = this.modelItem.value;
    }
    console.log('value ', this.value);
  }

  toggle(caseElement) {
    const cases = this.querySelectorAll('fx-case');
    Array.from(cases).forEach(c => {
      if (caseElement === c) {
        c.style.display = 'block';
      } else {
        c.style.display = 'none';
      }
    });
  }
}

window.customElements.define('fx-switch', FxSwitch);
