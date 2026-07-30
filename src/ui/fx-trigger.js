import XfAbstractControl from './abstract-control.js';
import { leadingDebounce } from '../events.js';

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
      if (!elements[0].getAttribute('tabindex')) {
        elements[0].setAttribute('tabindex', '0');
      }
      if (elements[0].nodeName !== 'BUTTON' && !elements[0].getAttribute('role')) {
        elements[0].setAttribute('role', 'button');
      }

      const element = elements[0];

      this.addEventListener('mousedown', e => {
        console.log('target', e.target.nodeName);
        e.target.focus();
      });

      // Opt-in: also run on focus (e.g. Tab-only keyboard navigation), not just
      // click/Enter/Space. Not the default - every fx-trigger in an app would otherwise
      // fire its action (e.g. an fx-delete) just from being tabbed past.
      const activateOnFocus = this.hasAttribute('activate-on-focus');
      // A mouse click on an already-unfocused element fires 'focus' then 'click' for the
      // same interaction; without this guard activateOnFocus would perform the action twice.
      let suppressNextClick = false;

      if (this.debounceDelay) {
        this.addEventListener(
          'click',
          leadingDebounce(
            this,
            e => {
              if (activateOnFocus && suppressNextClick) {
                suppressNextClick = false;
                return;
              }
              this.performActions(e);
            },
            this.debounceDelay,
          ),
        );
      } else {
        element.addEventListener('click', e => {
          if (activateOnFocus && suppressNextClick) {
            suppressNextClick = false;
            return;
          }
          this.performActions(e);
        });
      }

      if (activateOnFocus) {
        element.addEventListener('focus', e => {
          suppressNextClick = true;
          this.performActions(e);
          queueMicrotask(() => {
            suppressNextClick = false;
          });
        });
      }

      this.widget = element;
      // # terrible hack but browser behaves strange - seems to fire a 'click' for a button when it receives a
      // # 'Space' or 'Enter' key
      if (element.nodeName !== 'BUTTON') {
        element.addEventListener('keypress', e => {
          if (e.code === 'Space' || e.code === 'Enter') {
            if (activateOnFocus && suppressNextClick) {
              suppressNextClick = false;
              return;
            }
            this.performActions(e);
          }
        });
      }
    });
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
    // console.log('trigger update', this);
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
      // console.log('repeated click');
      repeatedItem.click();
    }

    for (let i = 0; i < this.children.length; i += 1) {
      const child = this.children[i];
      // XForms 2.0: action variables are evaluated in sequence between sibling
      // actions — a variable after an action sees that action's effects. Variables
      // nested inside an fx-action child are evaluated by fx-action.perform().
      if (child.localName === 'fx-var') {
        child.refresh();
        // eslint-disable-next-line no-continue
        continue;
      }
      if (typeof child.execute === 'function') {
        if (e) {
          // We are handling the event. Stop it from going further
          e.preventDefault();
          e.stopPropagation();
          if (e.type && child.event && e.type !== child.event) return;
        }
        // eslint-disable-next-line no-await-in-loop
        await child.execute(e);
        // child.execute(e);
      }
    }
  }

  async refresh() {
    super.refresh();
  }
}

if (!customElements.get('fx-trigger')) {
  customElements.define('fx-trigger', FxTrigger);
}
