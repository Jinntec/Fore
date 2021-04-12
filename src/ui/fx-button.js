import { html, css } from 'lit-element';
import '@polymer/paper-button/paper-button.js';
import XfAbstractControl from './fx-abstract-control.js';
/**
 * `fx-button`
 * a button triggering Fore actions
 *
 * @customElement
 * @demo demo/index.html
 */
class FxButton extends XfAbstractControl {
  static get styles() {
    return css`
      :host {
        display: inline-block;
      }
      paper-button {
        height: inherit;
      }
    `;
  }

  static get properties() {
    return {
      ...super.properties,
      label: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.label = '';
  }

  render() {
    return html`
      <paper-button id="control" @click="${this.performActions}" raised>${this.label}</paper-button>
      <slot></slot>
    `;
  }

  performActions() {
    console.log('performActions ', this.children);

    const repeatedItem = this.closest('fx-repeatitem');
    if (repeatedItem) {
      console.log('repeated click');
      repeatedItem.click();
    }
    for (let i = 0; i < this.children.length; i++) {
      // console.log('child ', this.children[i]);
      const child = this.children[i];

      if (typeof child.execute === 'function') {
        child.execute();
      } else {
        console.warn('child has no "execute" function ', child);
        return false;
      }
    }

    // ### signal to form that action-block is complete and changes should be send
    this.dispatchEvent(
      new CustomEvent('actions-performed', {
        composed: true,
        bubbles: true,
        detail: {},
      }),
    );

    return true;
  }

  refresh() {
    // super.refresh();
    // console.log('fx-button refresh');

    const elements = this.querySelectorAll(':scope > *');
    elements.forEach(element => {
      if (typeof element.refresh === 'function') {
        element.refresh();
      }
    });
  }

  handleRequired() {}
}

window.customElements.define('fx-button', FxButton);
