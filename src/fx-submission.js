import { LitElement, html, css } from 'lit-element';
import '@polymer/iron-ajax/iron-ajax.js';

// import * as fx from 'fontoxpath';
import { foreElementMixin } from './ForeElementMixin';

export class FxSubmission extends foreElementMixin(LitElement) {
  static get styles() {
    return css`
      :host {
        display: none;
      }
    `;
  }

  static get properties() {
    return {
      ...super.properties,
      id: {
        type: String,
      },
      /**
       * submission method - one of GET, POST, PUT, DELETE (HEAD?)
       */
      method: {
        type: String,
      },
      nonrelevant: {
        type: String,
      },
      /**
       * what to do with the submission response. Either 'none' or 'instance' for now.
       */
      replace: {
        type: String,
      },
      targetref: {
        type: String,
      },
      /**
       * the URL to submit to
       */
      url: {
        type: String,
      },
      validate: {
        type: Boolean,
      },
    };
  }

  constructor() {
    super();
    this.model = this.parentNode;
    // ### setting defaults...
    this.method = 'GET';
    this.nonrelevant = 'remove';
    this.url = '';
    this.replace = 'none';
    this.targetref = '';
    this.type = 'xml';
    this.validate = true;
  }

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

  submit() {
    //todo: call pre-hook once there is one ;)

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

  _handleOnSubmit() {
    //todo: implement submission pre-hook
  }

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
