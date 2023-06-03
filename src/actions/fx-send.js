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

  connectedCallback() {
    // eslint-disable-next-line wc/guard-super-call
    super.connectedCallback();
    // console.log('connectedCallback ', this);
    this.submission = this.getAttribute('submission');
    this.connection = this.hasAttribute('connection') ? this.getAttribute('connection'):null;
  }

  async perform() {
    super.perform();

    if(this.submission){
      await this._submit();
    } else if(this.connection){
      this._emitToChannel();
    }

  }

  async _submit() {
    console.log('submitting ', this.submission);
    // reset CSS class that signalled validation error during last submit
    this.getOwnerForm().classList.remove('submit-validation-failed');
    const submission = this.getModel().querySelector(`#${this.submission}`);
    if(!this._logError(submission)){
      await submission.submit();
    }
  }


  _emitToChannel(){
    console.log('modelItem?', this.modelItem.node);
    const channel = this.getModel().querySelector(`#${this.connection}`);
    if(!this._logError(channel)){
      channel.send();
    }

  }

  _logError(element){
    if(element === null){
      this.dispatchEvent(
          new CustomEvent('log', {
            composed: false,
            bubbles: true,
            cancelable: true,
            detail: {
              id: this.id,
              message: `fx-submission element with id: '${this.submission}' not found`,
              level: 'Error'
            },
          }),
      );
      return true;
    }
    return false;
  }
}

if (!customElements.get('fx-send')) {
  window.customElements.define('fx-send', FxSend);
}
