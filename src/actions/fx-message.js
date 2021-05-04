import { parseTpl } from './StringTpl.js';
import { FxAction } from './fx-action.js';

/**
 * `fx-message`
 *
 * Action to display messages to the user.
 *
 * todo: implementation and demo
 *
 */
class FxMessage extends FxAction {
  /*
    static get template() {
      return html`
        <style>
          :host {
            display: none;
          }
        </style>
      `;
    }
  */

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
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

    this.eventTarget = this.hasAttribute('target') ? this.getAttribute('target') : '';
    // super.connectedCallback();
    console.log('### fx-message connected ', this);

    if (this.eventTarget) {
      this.targetElement = document.getElementById(this.eventTarget);
      this.targetElement.addEventListener(this.event, e => this.execute(e));
    } else {
      this.targetElement = this.parentNode;
      this.targetElement.addEventListener(this.event, e => this.execute(e));
    }
    // this.id = "foobar";
  }

  disconnectedCallback() {
    // super.disconnectedCallback();
    this.targetElement.removeEventListener(this.event, e => this.execute(e));
  }

  renderHTML() {
    return `
        <slot></slot>
    `;
  }

  execute(e) {
    // console.log('fx-message.execute textContent: ', this.textContent);
    // const proceed = super.execute(e);
    // if(!proceed) return ;

    const details = e.detail;
    const result = parseTpl(this.textContent, details);
    console.log('result: ', result);

    // this.closest('fx-form').message(e.detail, result, this.level);

    this.dispatchEvent(
      new CustomEvent('message', {
        composed: true,
        bubbles: true,
        detail: { level: this.level, message: result },
      }),
    );
  }
}

window.customElements.define('fx-message', FxMessage);
