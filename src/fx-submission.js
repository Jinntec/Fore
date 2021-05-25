import '@polymer/iron-ajax/iron-ajax.js';

import { foreElementMixin } from './ForeElementMixin.js';
import {evaluateTemplateExpression, evaluateXPathToNodes} from './xpath-evaluation.js';


export class FxSubmission extends foreElementMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.style.display = 'none';
    this.model = this.parentNode;

    // ### initialize properties with defaults
    if (!this.hasAttribute('id')) throw new Error('id is required');
    this.id = this.getAttribute('id');

    /** if present should be a existing instance id */
    this.instance = this.hasAttribute('instance') ? this.getAttribute('instance') : null;

    /** http method */
    this.method = this.hasAttribute('method') ? this.getAttribute('method') : 'get';

    /** relevance processing - one of 'remove, keep or empty' */
    this.nonrelevant = this.hasAttribute('nonrelevant')
      ? this.getAttribute('nonrelevant')
      : 'remove';

    /** replace might be 'all', 'instance' or 'none' */
    this.replace = this.hasAttribute('replace') ? this.getAttribute('replace') : 'all';

    if (!this.hasAttribute('url')) throw new Error(`url is required for submission: ${this.id}`);
    this.url = this.getAttribute('url');

    this.targetref = this.hasAttribute('targetref') ? this.getAttribute('targetref') : null;

    this.mediatype = this.hasAttribute('mediatype')
      ? this.getAttribute('mediatype')
      : 'application/xml';

    this.validate = this.getAttribute('validate') ? this.getAttribute('validate') : 'true';

    this.shadowRoot.innerHTML = this.renderHTML();

    // ### add listener to iron-ajax
    const sub = this.shadowRoot.querySelector('#submitter');
    sub.addEventListener('response', () => this._handleResponse());
    sub.addEventListener('error', () => this._handleError());
    this.addEventListener('submit', () => this._submit());
  }

  renderHTML() {
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

  submit() {
    this.dispatchEvent(
      new CustomEvent('submit', {
        composed: true,
        bubbles: true,
        detail: {},
      }),
    );
  }

  _submit() {
    console.log('submitting....');
    this.evalInContext();
    const model = this.getModel();

    model.recalculate();

    if (this.validate) {
      const valid = model.revalidate();
      if (!valid) {
        return;
      }
    }

    this.url = 'foobar';
    // this._updateTemplateExpressions();
    this._serializeAndSend();
  }

  _updateTemplateExpressions(){
    if (!this.storedTemplateExpressions) {
      this.storedTemplateExpressions = [];
    }

/*
    const search =
        ".//@*[contains(.,'{')]";

    const tmplExpressions = evaluateXPathToNodes(search, this, this.getOwnerForm());
*/
    const tmplExpressions = this.attributes;
    /*
    storing expressions and their nodes for re-evaluation
     */
    Array.from(tmplExpressions).forEach(node => {
      const expr = node.value;
      this.storedTemplateExpressions.push({
        expr,
        node
      });
    });

    this.storedTemplateExpressions.forEach(tmpl => {
      this._processTemplateExpression(tmpl);
    });

  }

  // eslint-disable-next-line class-methods-use-this
  _processTemplateExpression(exprObj) {
    console.log('processing template expression ', exprObj);

    const { expr } = exprObj;
    const { node } = exprObj;
    // console.log('expr ', expr);
    evaluateTemplateExpression(expr,node, this);
  }


  _serializeAndSend() {
    const submitter = this.shadowRoot.getElementById('submitter');
    const serializer = new XMLSerializer();
    const data = serializer.serializeToString(this.nodeset);
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

    if (this.replace === 'instance') {
      let targetInstance;
      if (this.instance) {
        targetInstance = this.model.getInstance(this.instance);
      } else {
        targetInstance = this.model.getInstance('default');
      }
      if (targetInstance) {
        const instanceData = new DOMParser().parseFromString(submitter.lastResponse, 'text/xml');
        targetInstance.instanceData = instanceData;
        console.log('### replaced instance ', targetInstance.instanceData);
        this.model.updateModel(); // force update
        this.model.formElement.refresh();
      } else {
        throw new Error(`target instance not found: ${targetInstance}`);
      }
    }
    if (this.replace !== 'none') {
      // ### 1. try to get instance with matching id
      const targetInstance = this.model.getInstance(this.replace);
      if (targetInstance) {
        const instanceData = new DOMParser().parseFromString(submitter.lastResponse, 'text/xml');
        targetInstance.instanceData = instanceData;
        // targetInstance.instanceData = submitter.lastResponse;
        // this.model.updateModel(); // force update
        // this.model.formElement.refresh();
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
