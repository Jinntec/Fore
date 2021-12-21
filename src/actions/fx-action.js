import { AbstractAction } from './abstract-action.js';

/**
 * `fx-action`
 * an action to wrap other actions and defers the update cycle until the end of the block.
 *
 * @customElement
 * @demo demo/index.html
 */
export class FxAction extends AbstractAction {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.src = this.hasAttribute('src') ? this.getAttribute('src') : null;
    const style = `
        :host{
            display:none;
        }
    `;
    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        <slot></slot>
    `;
  }

  perform() {
    const { children } = this;

    if (this.src) {
      this.innerHTML = ''; // reset
      console.log('### fx-script.perform ');
      const script = document.createElement('script');
      script.src = this.src;
      this.appendChild(script);
    } else {
      Array.from(children).forEach(action => {
        action.detail = this.detail;
        // action.perform();
        action.execute();
      });
      this.dispatchActionPerformed()
      // this.needsUpdate = false;
    }
  }
}

window.customElements.define('fx-action', FxAction);
