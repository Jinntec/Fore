import XfAbstractControl from './abstract-control.js';

function leadingDebounce(func, timeout = 300){
  console.log('debouncing', func);
  let timer;
  return (...args) => {
    if (!timer) {
      func.apply(this, args);
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      return null;
    }, timeout);
  };
}

export class FxTrigger extends XfAbstractControl {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.ref = this.hasAttribute('ref') ? this.getAttribute('ref') : null;
    this.debounceDelay = this.hasAttribute('debounce') ? this.getAttribute('debounce') : null;

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

      if(this.debounceDelay){
        this.addEventListener(
            'click',
            leadingDebounce((e) => {
              this.performActions(e)
            }, this.debounceDelay),
        );
      }else{
        element.addEventListener('click', e => this.performActions(e));
      }
      this.widget = element;
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

  getWidget() {
    return this.widget;
  }

  async updateWidgetValue() {
    console.log('trigger update', this);
    return null;
  }

  handleReadonly() {
    super.handleReadonly();
    // ### add disabled attribute in case we're readonly. This is special behavior of fx-trigger
    if (this.widget.hasAttribute('readonly')) {
      this.widget.setAttribute('disabled', 'disabled');
    } else {
      this.widget.removeAttribute('disabled');
    }
  }

  async performActions(e) {
    // todo: support readonly for trigger not executing the action
    const repeatedItem = this.closest('fx-repeatitem');
    if (repeatedItem) {
      console.log('repeated click');
      repeatedItem.click();
    }

    // Update all child variables, but only once
    this.querySelectorAll('fx-var').forEach(variableElement => variableElement.refresh());

    const forLoop = async () => {
      for (let i = 0; i < this.children.length; i += 1) {
        const child = this.children[i];
        if (typeof child.execute === 'function') {
          // eslint-disable-next-line no-await-in-loop
          await child.execute(e);
        }
      }
    };
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

if (!customElements.get('fx-trigger')) {
  customElements.define('fx-trigger', FxTrigger);
}
