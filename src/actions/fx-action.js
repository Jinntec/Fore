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

  async perform() {
    super.perform();
    const { children } = this;

    if (this.src) {
      this.innerHTML = ''; // reset
      const script = document.createElement('script');
      script.src = this.src;
      this.appendChild(script);
    } else {
      for (const actionOrVar of children) {
        if (actionOrVar.localName === 'fx-var') {
          continue;
        }
        const action = actionOrVar;
        action.detail = this.detail;
        await action.execute();
      }
      this.dispatchActionPerformed();
      this.needsUpdate = true;
    }
  }
}

if (!customElements.get('fx-action')) {
  window.customElements.define('fx-action', FxAction);
}
