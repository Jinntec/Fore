import { LitElement, html } from 'lit-element';
import { parseTpl } from './StringTpl.js';

/**
 * `fx-message`
 * general class for bound elements
 *
 * todo: implementation and demo
 *
 * @customElement
 * @polymer
 */
class FxMessage extends LitElement {
  static get template() {
    return html`
      <style>
        :host {
          display: none;
        }
      </style>
    `;
  }

  static get properties() {
    return {
      bind: {
        type: String,
      },
      repeat: {
        type: String,
      },
      event: {
        type: String,
      },
      level: {
        type: String,
        value: 'ephemeral',
      },
      id: {
        type: String,
      },
      eventTarget: {
        type: String,
        attribute:'event-target'
      },
      targetElement: {
        type: Object,
      },
    };
  }

  connectedCallback() {
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
