import '../fx-model.js';
import '../fx-submission.js';
import { AbstractAction } from './abstract-action.js';

/**
 * `fx-send` - finds and activates a `fx-submission` element.
 *
 * extension idea: allow params to be passed as with dispatch action which can be used to set properties on submission attributes
 *
 * @customElement
 */
class FxSend extends AbstractAction {
  constructor() {
    super();
    this.value = '';
  }

	static get properties () {
		return {
			submission: {
				type: 'referencedNode'
			},
			...AbstractAction.properties,
		};
	}

	get submission () {
		return this.getModel().querySelector(`#${this._submission}`);
	}

  connectedCallback() {
    // eslint-disable-next-line wc/guard-super-call
    super.connectedCallback();
    // console.log('connectedCallback ', this);
    this._submission = this.getAttribute('submission');
  }

  async perform() {
    super.perform();

    // reset CSS class that signalled validation error during last submit
    this.getOwnerForm().classList.remove('submit-validation-failed');

    // if not exists signal error
    // todo: instead of relying on model just use pure dom to find submission as the context could be broken due to a delete action
    // const fore = this.closest('fx-fore');
    // const submission = fore.querySelector(`#${this.submission}`);
      const {submission} = this;
    if (submission === null) {
/*
      this.dispatchEvent(
        new CustomEvent('error', {
          composed: true,
          bubbles: true,
          detail: { message: `fx-submission element with id: '${this.submission}' not found` },
        }),
      );
*/
      this.dispatchEvent(
          new CustomEvent('log', {
            composed: false,
            bubbles: true,
            cancelable:true,
            detail: { id:this.id, message: `fx-submission element with id: '${this.submission}' not found`, level:'Error'},
          }),
      );
      return;

      // throw new Error(`submission with id: ${this.submission} not found`);
    }
      await submission.submit();
/*
    if(submission.replace === 'instance'){
      this.getModel().updateModel();
      this.getOwnerForm().refresh();
    }
*/
    // if not of type fx-submission signal error
  }
}

if (!customElements.get('fx-send')) {
  window.customElements.define('fx-send', FxSend);
}
