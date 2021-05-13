import '../fx-model.js';
import '../fx-submission.js';
import { AbstractAction } from './abstract-action.js';

/**
 * `fx-send` - finds and activates a `fx-submission` element.
 *
 *
 * @customElement
 */
class FxSend extends AbstractAction {

  constructor() {
    super();
    this.value = '';
  }

  connectedCallback() {
    // eslint-disable-next-line wc/guard-super-call
    super.connectedCallback();
    console.log('connectedCallback ', this);
    this.submission = this.getAttribute('submission');
  }

  perform() {
    super.perform();

    console.log('submitting ', this.submission);
    console.log('submitting model', this.getModel());

    // if not exists signal error
    const submission = this.getModel().querySelector(`#${this.submission}`);
    if (submission === null) {
      this.dispatchEvent(
        new CustomEvent('error', {
          composed: true,
          bubbles: true,
          detail: { message: `fx-submission element with id: '${this.submission}' not found` },
        }),
      );
      throw new Error(`submission with id: ${this.submission} not found`);
    }
    console.log('submission', submission);
    submission.submit();
    // if not of type fx-submission signal error
  }
}

window.customElements.define('fx-send', FxSend);
