import '@polymer/iron-ajax/iron-ajax.js';

import { foreElementMixin } from './ForeElementMixin.js';

export class FxSubmission extends foreElementMixin(HTMLElement) {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(){
    this.style.display = 'none';
    this.model = this.parentNode;

    // ### initialize properties with defaults
    if(!this.hasAttribute('id'))
      throw new Error('id is required');
    this.id = this.getAttribute('id');

    this.method = this.hasAttribute('method')?this.getAttribute('method'):'get';
    this.nonrelevant = this.hasAttribute('nonrelevant')?this.getAttribute('nonrelevant'):'remove';
    this.replace = this.hasAttribute('replace')?this.getAttribute('replace'):'none';

    if(!this.hasAttribute('url'))
      throw new Error(`url is required for submission: ${this.id}`);
    this.url = this.getAttribute('url');

    this.targetref = this.hasAttribute('targetref')?this.getAttribute('targetref'):null;

    this.mediatype = this.hasAttribute('mediatype')?this.getAttribute('mediatype'):'application/xml';
    this.validate = this.getAttribute('validate')?this.getAttribute('validate'):'true';

    this.shadowRoot.innerHTML = this.renderHTML();
    console.log('innerHTML ', this.shadowRoot.innerHTML)

    // ### add listener to iron-ajax
    const sub = this.shadowRoot.querySelector('#submitter');
    sub.addEventListener('response', () => this._handleResponse());
    sub.addEventListener('error', () => this._handleError());

  }

  renderHTML () {
    return `
      <slot></slot>
      <iron-ajax
        id="submitter"
        content-type="text/xml"
        url="${this.url}"
        method="${this.method}"
        handle-as="text"
        with-credentials></iron-ajax>
    `;
  }

  /*
  render() {
    return html`
      ${this.url
        ? html`
            <iron-ajax
              id="submitter"
              content-type="text/xml"
              url="${this.url}"
              method="${this.method}"
              handle-as="text"
              with-credentials
              @error="${this._handleError}"
              @response="${this._handleResponse}"
            ></iron-ajax>
          `
        : ''}
      <slot></slot>
    `;
  }
*/

  submit() {
    // todo: call pre-hook once there is one ;)

    // ### 1. update xpath context
    this.evalInContext();

    // ### 2. validate for submission
    const model = this.getModel();
    model.recalculate();

    if (this.validate) {
      model.revalidate();
    }

    // ### [3. select relevant nodes]
    // ### [4. set request headers]
    // ### 5. resolve URL
    // ### 6. get serialized data if necessary
    console.log('data ', this.nodeset);
    // ### 7. trigger the submit execution

    const submitter = this.shadowRoot.getElementById('submitter');
    console.log('submitter ', submitter);

    const serializer = new XMLSerializer();
    const data = serializer.serializeToString(this.nodeset);
    console.log('serialized data ', data);
    submitter.body = data;
    submitter.generateRequest();
  }

  /*
  _handleOnSubmit() {
    // todo: implement submission pre-hook
  }
*/

  _handleResponse() {
    // ### check for 'replace' option
    const submitter = this.shadowRoot.getElementById('submitter');
    console.log('response ', submitter);
    console.log('response ', submitter.lastResponse);
    console.log('response ', submitter.lastError);

    if (this.replace !== 'none') {
      // ### 1. try to get instance with matching id
      const targetInstance = this.model.getInstance(this.replace);
      if (targetInstance) {
        const instanceData = new DOMParser().parseFromString(submitter.lastResponse, 'text/xml');
        targetInstance.instanceData = instanceData;
        // targetInstance.instanceData = submitter.lastResponse;
        console.log('replaced instance ', targetInstance.instanceData);
        this.model.updateModel(); // force update
        this.model.formElement.refresh();
      }

      // todo: evaluate expression in curly braces as xpath to resolve to the targetNode to replace
    }

    this.dispatchEvent(
      new CustomEvent('submit-done', {
        composed: true,
        bubbles: true,
        detail: {},
      }),
    );
  }

  _handleError() {
    console.log('ERRRORRRRR');
    this.dispatchEvent(
      new CustomEvent('submit-error', {
        composed: true,
        bubbles: true,
        detail: {},
      }),
    );
  }
}
customElements.define('fx-submission', FxSubmission);
