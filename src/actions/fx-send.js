import '../fx-model.js';
import '../fx-submission.js';
import { AbstractAction } from './abstract-action.js';
import {XPathUtil} from "../xpath-util.js";

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
    this.url = null;
    this.target=null;
  }

  connectedCallback() {
    // eslint-disable-next-line wc/guard-super-call
    super.connectedCallback();
    // console.log('connectedCallback ', this);
    this.submission = this.getAttribute('submission');
      this.url = this.hasAttribute('url') ? this.getAttribute('url'):null;
      this.target = this.hasAttribute('target') ? this.getAttribute('target'):null;
      this.connection = this.hasAttribute('connection') ? this.getAttribute('connection'):null;
  }

  async perform() {
    super.perform();

    console.log('submitting ', this.submission);
    // reset CSS class that signalled validation error during last submit
    this.getOwnerForm().classList.remove('submit-validation-failed');
    const submission = this.getModel().querySelector(`#${this.submission}`);
    if (submission === null) {
      this.dispatchEvent(
          new CustomEvent('error', {
            composed: false,
            bubbles: true,
            cancelable:true,
            detail: { id:this.id,
                      origin: this,
                      message: `<fx-submission id="${this.submission}"> not found`,
                      expr:XPathUtil.getDocPath(this),
                      level:'Error'},
          }),
      );
      return;

      // throw new Error(`submission with id: ${this.submission} not found`);
    }
    console.log('submission', submission);
    if(this.connection){
      this._emitToChannel();
      return;
    }

    if(this.url){
      const resolved = this.evaluateAttributeTemplateExpression(this.url,this);
      submission.parameters.set('url',resolved);
    }
    if(this.target){
      const resolved = this.evaluateAttributeTemplateExpression(this.target,this);
      submission.parameters.set('target',resolved);
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
    _emitToChannel(){
        console.log('modelItem?', this.modelItem.node);
        const channel = this.getModel().querySelector(`#${this.connection}`);
        if(!this._logError(channel)){
            channel.send();
        }

    }

}

if (!customElements.get('fx-send')) {
  window.customElements.define('fx-send', FxSend);
}
