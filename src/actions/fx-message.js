import { AbstractAction } from './abstract-action.js';

/**
 * `fx-message`
 *
 * Action to display messages to the user.
 *
 *
 */
class FxMessage extends AbstractAction {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    super.connectedCallback();
    this.event = this.hasAttribute('event') ? this.getAttribute('event') : '';
    this.level = this.hasAttribute('level') ? this.getAttribute('level') : 'ephemeral';
    const style = `
        :host{
            display:none;
        }
    `;
    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        ${this.renderHTML()}
    `;
  }

  disconnectedCallback() {
    // super.disconnectedCallback();
    this.targetElement.removeEventListener(this.event, e => this.execute(e));
  }

  // eslint-disable-next-line class-methods-use-this
  renderHTML() {
    return `
        <slot></slot>
    `;
  }

  perform() {
    super.perform();
    let message;
    if (this.hasAttribute('value')) {
      message = this.getValue();
    } else {
      message = this.textContent;
    }

    this.dispatchEvent(
      new CustomEvent('message', {
        composed: true,
        bubbles: true,
        detail: { level: this.level, message },
      }),
    );
  }
}

if (!customElements.get('fx-message')) {
  window.customElements.define('fx-message', FxMessage);
}
