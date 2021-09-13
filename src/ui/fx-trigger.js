import XfAbstractControl from './abstract-control.js';

export class FxTrigger extends XfAbstractControl {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.ref = this.hasAttribute('ref') ? this.getAttribute('ref') : null;
    const style = `
          :host {
            cursor:pointer;
          }
        `;

    this.shadowRoot.innerHTML = `
                <style>
                    ${style}
                </style>
                ${this.renderHTML()}
        `;

    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', () => {
      const elements = slot.assignedElements({ flatten: true });
      elements[0].setAttribute('tabindex', '0');
      elements[0].setAttribute('role', 'button');

      const element = elements[0];
      element.addEventListener('click', e => this.performActions(e));

      // # terrible hack but browser behaves strange - seems to fire a 'click' for a button when it receives a
      // # 'Space' or 'Enter' key
      if (element.nodeName !== 'BUTTON') {
        element.addEventListener('keypress', e => {
          if (e.code === 'Space' || e.code === 'Enter') {
            this.performActions(e);
          }
        });
      }
    });
    /*
        this.addEventListener('click', e => this.performActions(e));
        this.addEventListener('keypress', (e) => {
            if(e.code === 'Space' || e.code === 'Enter'){
                this.performActions(e);
            }
        });
*/
  }

  // eslint-disable-next-line class-methods-use-this
  renderHTML() {
    return `
            <slot></slot>
    `;
  }

  async performActions(e) {
    const repeatedItem = this.closest('fx-repeatitem');
    if (repeatedItem) {
      console.log('repeated click');
      repeatedItem.click();
    }

    const forLoop = async () => {
      for (let i = 0; i < this.children.length; i += 1) {
        const child = this.children[i];
        if (typeof child.execute === 'function') {
          // eslint-disable-next-line no-await-in-loop
          await child.execute(e);
        }
      }
    }
    forLoop();
  }

  /*
      async refresh() {
        super.refresh();
        // console.log('fx-button refresh');

        const elements = this.querySelectorAll(':scope > *');
        elements.forEach(element => {
          if (typeof element.refresh === 'function') {
            element.refresh();
          }
        });
      }
    */
}

customElements.define('fx-trigger', FxTrigger);
