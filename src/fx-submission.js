import { foreElementMixin } from './ForeElementMixin.js';
import { evaluateXPathToString } from './xpath-evaluation.js';
import getInScopeContext from './getInScopeContext.js';

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

    this.addEventListener('submit', () => this._submit());
  }

  // eslint-disable-next-line class-methods-use-this
  renderHTML() {
    return `
      <slot></slot>
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

    this._serializeAndSend();
  }

  /**
   * resolves template expressions for a single attribute
   * @param expr the attribute value to evaluate
   * @param node the attribute node used for scoped resolution
   * @returns {*}
   * @private
   */
  _evaluateAttributeTemplateExpression(expr, node) {
    const matches = expr.match(/{[^}]*}/g);
    if (matches) {
      matches.forEach(match => {
        console.log('match ', match);
        const naked = match.substring(1, match.length - 1);
        const inscope = getInScopeContext(node, naked);
        const result = evaluateXPathToString(naked, inscope, this.getOwnerForm());
        const replaced = expr.replaceAll(match, result);
        console.log('result of replacing ', replaced);
        expr = replaced;
      });
    }
    return expr;
  }

  /**
   * sends the data after evaluating
   *
   * todo: can send only XML at the moment
   * @private
   */
  async _serializeAndSend() {
    const resolvedUrl = this._evaluateAttributeTemplateExpression(this.url, this);
    const serializer = new XMLSerializer();

    const relevant = this.selectRelevant();
    console.log('relevant nodes', relevant);

    let serialized = serializer.serializeToString(this.nodeset);
    if (this.method.toLowerCase() === 'get') {
      serialized = undefined;
    }
    const response = await fetch(resolvedUrl, {
      method: this.method,
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        'Content-type': 'application/xml; charset=UTF-8',
      },
      body: serialized,
    });

    if (!response.ok) {
      this.dispatchEvent(
        new CustomEvent('submit-error', {
          composed: true,
          bubbles: true,
          detail: { message: `Error while submitting ${this.id}` },
        }),
      );
    }

    const contentType = response.headers.get('content-type').toLowerCase();

    if (contentType.startsWith('text/plain') || contentType.startsWith('text/html')) {
      const text = await response.text();
      this._handleResponse(text);
    } else if (contentType.startsWith('application/json')) {
      const json = await response.json();
      this._handleResponse(json);
    } else if (contentType.startsWith('application/xml')) {
      const text = await response.text();
      const xml = new DOMParser().parseFromString(text, 'application/xml');
      this._handleResponse(xml);
    } else {
      const blob = await response.blob();
      this._handleResponse(blob);
    }
  }

  _getUrlExpr() {
    return this.storedTemplateExpressions.find(stored => stored.node.nodeName === 'url');
  }

  _getTargetInstance() {
    let targetInstance;
    if (this.instance) {
      targetInstance = this.model.getInstance(this.instance);
    } else {
      targetInstance = this.model.getInstance('default');
    }
    if (!targetInstance) {
      throw new Error(`target instance not found: ${targetInstance}`);
    }
    return targetInstance;
  }

  _handleResponse(data) {
    console.log('_handleResponse ', data);
    if (this.replace === 'instance') {
      const targetInstance = this._getTargetInstance();
      if (targetInstance) {
        const instanceData = data;
        targetInstance.instanceData = instanceData;
        console.log('### replaced instance ', targetInstance.instanceData);
        this.model.updateModel(); // force update
        // this.model.formElement.refresh();
        this.getOwnerForm().refresh();
      } else {
        throw new Error(`target instance not found: ${targetInstance}`);
      }
    }

    if (this.replace === 'all') {
      document.getElementsByTagName('html')[0].innerHTML = data;
    }
    if (this.replace === 'target') {
      const target = this.getAttribute('target');
      const targetNode = document.querySelector(target);
      targetNode.innerHTML = data;
    }
    if (this.replace === 'redirect') {
      window.location.href = data;
    }

    this.dispatchEvent(
      new CustomEvent('submit-done', {
        composed: true,
        bubbles: true,
        detail: {},
      }),
    );
  }

  /**
   * select relevant nodes
   *
   * todo: support for 'empty'
   * @returns {*}
   */
  selectRelevant(){
    if(this.nonrelevant === 'keep'){
      return this.nodeset;
    }

    // first check if nodeset of submission is relevant - otherwise bail out
    const mi = this.getModel().getModelItem(this.nodeset);
    if(mi && !mi.relevant) return null;

    const doc = new DOMParser().parseFromString('<data></data>', 'application/xml');
    const root = doc.firstElementChild;
    const result = this._filterRelevant(this.nodeset, root);
    return result;
  }

  _filterRelevant(node,result){

    // const attrs = node.getAllAttributes();
    const {children} = node;
    Array.from(children).forEach( n => {
      const mi = this.getModel().getModelItem(n);
      // no ModelItem means we default to relevant=true
      if (!mi || mi.relevant) {
          const clone = n.cloneNode();
          result.appendChild(clone);
          if(n.innerText){
            clone.innerText = n.innerText;
          }
          return this._filterRelevant(n, clone);
      }
          // this._filterRelevant(n.nextElementSibling);
    });
    return result;
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
