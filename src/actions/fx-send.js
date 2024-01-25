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
  }

  async perform() {
    super.perform();

    console.log('submitting ', this.submission);
    // reset CSS class that signalled validation error during last submit
    this.getOwnerForm().classList.remove('submit-validation-failed');
    // console.log('submitting model', this.getModel());

    // if not exists signal error
    // todo: instead of relying on model just use pure dom to find submission as the context could be broken due to a delete action
    // const fore = this.closest('fx-fore');
    // const submission = fore.querySelector(`#${this.submission}`);
    const submission = this.getModel().querySelector(`#${this.submission}`);
    if (submission === null) {
/*
      this.dispatchEvent(
        new CustomEvent('error', {
          composed: true,
          bubbles: true,
          detail: { message: `fx-submission element with id: '${this.submission}' not found - ${XPathUtil.getDocPath(this)}` },
        }),
      );
*/
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

    if(this.url){
      const resolved = this.evaluateAttributeTemplateExpression(this.url,this);
      submission.parameters.set('url',resolved);
    }
    if(this.target){
      const resolved = this.evaluateAttributeTemplateExpression(this.target,this);
      submission.parameters.set('target',resolved);
    }


/*
    Array.from(this.attributes).forEach( attr => {
      if(attr.nodeName !== 'submission'){
        const resolved = this.evaluateAttributeTemplateExpression(attr,this);
        submission.parameters.set(attr.nodeName,resolved);
      }
    });
*/

    console.log('submission', submission);
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
