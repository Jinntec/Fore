import { Fore } from './fore.js';
import { Relevance } from './relevance.js';
import { foreElementMixin } from './ForeElementMixin.js';
import { evaluateXPathToString, evaluateXPath } from './xpath-evaluation.js';
import getInScopeContext from './getInScopeContext.js';

/**
 * todo: validate='false'
 */
export class FxSubmission extends foreElementMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // this.style.display = 'none';
    this.methods = ['get', 'put', 'post', 'delete', 'head', 'urlencoded-post'];

    this.model = this.parentNode;

    // ### initialize properties with defaults
    // if (!this.hasAttribute('id')) throw new Error('id is required');
    if (!this.hasAttribute('id')) console.warn('id is required');
    this.id = this.getAttribute('id');

    /** if present should be a existing instance id */
    this.instance = this.hasAttribute('instance') ? this.getAttribute('instance') : null;

    /** if present will determine XPath where to insert a response into when mode is 'replace' */
    this.into = this.hasAttribute('into') ? this.getAttribute('into') : null;

    /** http method */
    this.method = this.hasAttribute('method') ? this.getAttribute('method') : 'get';

    /** relevance processing - one of 'remove, keep or empty' */
    this.nonrelevant = this.hasAttribute('nonrelevant')
      ? this.getAttribute('nonrelevant')
      : 'remove';

    /** replace might be 'all', 'instance' or 'none' */
    this.replace = this.hasAttribute('replace') ? this.getAttribute('replace') : 'all';

    this.serialization = this.hasAttribute('serialization')
      ? this.getAttribute('serialization')
      : 'xml';

    // if (!this.hasAttribute('url')) throw new Error(`url is required for submission: ${this.id}`);
    if (!this.hasAttribute('url')) console.warn(`url is required for submission: ${this.id}`);
    this.url = this.getAttribute('url');

    this.targetref = this.hasAttribute('targetref') ? this.getAttribute('targetref') : null;

    this.mediatype = this.hasAttribute('mediatype')
      ? this.getAttribute('mediatype')
      : 'application/xml';

    this.validate = this.getAttribute('validate') ? this.getAttribute('validate') : 'true';
    this.shadowRoot.innerHTML = this.renderHTML();
  }

  // eslint-disable-next-line class-methods-use-this
  renderHTML() {
    return `
      <slot></slot>
    `;
  }

  async submit() {
    await Fore.dispatch(this,'submit', { submission: this });
    this._submit();
  }

  async _submit() {
    console.log('submitting....');
    this.evalInContext();
    const model = this.getModel();

    model.recalculate();

    if (this.validate) {
      const valid = model.revalidate();
      if (!valid) {
        console.log('validation failed. Bubmission stopped');
        // ### allow alerts to pop up
        // this.dispatch('submit-error', {});
        Fore.dispatch(this,'submit-error',{});
        this.getModel().parentNode.refresh();
        return;
      }
    }
    console.log('model updated....');
    await this._serializeAndSend();
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
        console.log('replacing ', expr, ' with ', replaced);
        expr = replaced;
      });
    }
    return expr;
  }

  /**
   * sends the data after evaluating
   *
   * @private
   */
  async _serializeAndSend() {
    const resolvedUrl = this._evaluateAttributeTemplateExpression(this.url, this);

    const instance = this.getInstance();
    console.log('instance type', instance.type);

    let serialized;
    if (this.serialization === 'none') {
      serialized = undefined;
    } else {
      // const relevant = this.selectRelevant(instance.type);
      const relevant = Relevance.selectRelevant(this, instance.type);
      serialized = this._serialize(instance.type, relevant);
    }

    // let serialized = serializer.serializeToString(relevant);
    if (this.method.toLowerCase() === 'get') {
      serialized = undefined;
    }
    // console.log('data being send', serialized);
    // console.log('submitting data',serialized);

    // if (resolvedUrl === '#echo') {
    if (resolvedUrl.startsWith('#echo')) {
      let data = null;
      if (serialized && instance.type === 'xml') {
        data = new DOMParser().parseFromString(serialized, 'application/xml');
      }
      if (serialized && instance.type === 'json') {
        data = JSON.parse(serialized);
      }
      this._handleResponse(data);
      // this.dispatch('submit-done', {});
      Fore.dispatch(this,'submit-done',{});
      return;
    }
    // ### setting headers
    const headers = this._getHeaders();
    console.log('headers', headers);

    // ### map urlencoded-post to post for fetch
    if (this.method === 'urlencoded-post') {
      this.method = 'post';
    }

    if (!this.methods.includes(this.method.toLowerCase())) {
      // this.dispatch('error', { message: `Unknown method ${this.method}` });
      Fore.dispatch(this, 'error', { message: `Unknown method ${this.method}` });
      return;
    }
    const response = await fetch(resolvedUrl, {
      method: this.method,
      mode: 'cors',
      credentials: 'include',
      headers,
      body: serialized,
    });

    if (!response.ok || response.status > 400) {
      // this.dispatch('submit-error', { message: `Error while submitting ${this.id}` });
      Fore.dispatch(this,'submit-error',{ message: `Error while submitting ${this.id}` });
      return;
    }

    const contentType = response.headers.get('content-type').toLowerCase();
    if (
      contentType.startsWith('text/plain') ||
      contentType.startsWith('text/html') ||
      contentType.startsWith('text/markdown')
    ) {
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

    // this.dispatch('submit-done', {});
    Fore.dispatch(this,'submit-done',{});
  }

  _serialize(instanceType, relevantNodes) {
    if (this.method === 'urlencoded-post') {
      // this.method = 'post';
      const params = new URLSearchParams();
      // console.log('nodes to serialize', relevantNodes);
      Array.from(relevantNodes.children).forEach(child => {
        params.append(child.nodeName, child.textContent);
      });
      return params;
    }
    if (instanceType === 'xml') {
      const serializer = new XMLSerializer();
      return serializer.serializeToString(relevantNodes);
    }
    if (instanceType === 'json') {
      // console.warn('JSON serialization is not yet supported')
      return JSON.stringify(relevantNodes);
    }
    throw new Error('unknown instance type ', instanceType);
  }

  _getHeaders() {
    const headers = new Headers();

    // ### set content-type header according to type of instance
    const instance = this.getInstance();
    const contentType = Fore.getContentType(instance, this.method);
    headers.append('Content-Type', contentType);
    // ### needed to overwrite browsers' setting of 'Accept' header
    if (headers.has('Accept')) {
      headers.delete('Accept');
    }
    // headers.append('Accept', 'application/xml');

    // ### add header defined by fx-header elements
    const headerElems = this.querySelectorAll('fx-header');
    Array.from(headerElems).forEach(header => {
      const { name } = header;
      const val = header.getValue();
      headers.append(name, val);
    });
    return headers;
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

  /**
   * handles replacement of instance data from response data.
   *
   * Please note that data might be
   * @param data
   * @private
   */
  _handleResponse(data) {
    console.log('_handleResponse ', data);

    /*
    // ### responses need to be handled depending on their type.
    if(this.type === 'json'){

    }
*/

    if (this.replace === 'instance') {
      const targetInstance = this._getTargetInstance();
      if (targetInstance) {
        if (this.targetref) {
          const [theTarget] = evaluateXPath(
            this.targetref,
            targetInstance.instanceData.firstElementChild,
            this,
          );
          console.log('theTarget', theTarget);
          const clone = data.firstElementChild;
          const parent = theTarget.parentNode;
          parent.replaceChild(clone, theTarget);
          console.log('finally ', parent);
        } else if (this.into) {
          const [theTarget] = evaluateXPath(
            this.into,
            targetInstance.instanceData.firstElementChild,
            this,
          );
          console.log('theTarget', theTarget);
          theTarget.innerHTML = data;
        } else {
          const instanceData = data;
          targetInstance.instanceData = instanceData;
          console.log('### replaced instance ', this.getModel().instances);
          console.log('### replaced instance ', targetInstance.instanceData);
        }

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
  }

  /**
   * select relevant nodes
   *
   * @returns {*}
   */
  /*
  selectRelevant(type) {
    console.log('selectRelevant' ,type)
    switch (type){
      case 'xml':
        return this._relevantXmlNodes();
      default:
        console.warn(`relevance selection not supported for type:${this.type}`);
        return this.nodeset;
    }
  }
*/

  // todo: support for 'empty'
  /*
  _relevantXmlNodes() {
    // ### no relevance selection - current nodeset is used 'as-is'
    if (this.nonrelevant === 'keep') {
      return this.nodeset;
    }

    // first check if nodeset of submission is relevant - otherwise bail out
    const mi = this.getModel().getModelItem(this.nodeset);
    if (mi && !mi.relevant) return null;

    const doc = new DOMParser().parseFromString('<data></data>', 'application/xml');
    const root = doc.firstElementChild;

    if (this.nodeset.children.length === 0 && this._isRelevant(this.nodeset)) {
      return this.nodeset;
    }
    return this._filterRelevant(this.nodeset, root);
  }
*/

  /*
  _filterRelevant(node, result) {
    const { childNodes } = node;
    Array.from(childNodes).forEach(n => {
      if (this._isRelevant(n)) {
        const clone = n.cloneNode(false);
        result.appendChild(clone);
        const { attributes } = n;
        if (attributes) {
          Array.from(attributes).forEach(attr => {
            if (this._isRelevant(attr)) {
              clone.setAttribute(attr.nodeName, attr.value);
            } else if (this.nonrelevant === 'empty') {
              clone.setAttribute(attr.nodeName, '');
            } else {
              clone.removeAttribute(attr.nodeName);
            }
          });
        }
        return this._filterRelevant(n, clone);
      }
      return null;
    });
    return result;
  }
*/

  /*
  _isRelevant(node) {
    const mi = this.getModel().getModelItem(node);
    if (!mi || mi.relevant) {
      return true;
    }
    return false;
  }
*/

  _handleError() {
    // this.dispatch('submit-error', {});
    Fore.dispatch(this,'submit-error',{});
    /*
                console.log('ERRRORRRRR');
                this.dispatchEvent(
                    new CustomEvent('submit-error', {
                        composed: true,
                        bubbles: true,
                        detail: {},
                    }),
                );
        */
  }
}
if (!customElements.get('fx-submission')) {
  customElements.define('fx-submission', FxSubmission);
}
