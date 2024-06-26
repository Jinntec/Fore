import { Fore } from './fore.js';
import { evaluateXPathToFirstNode } from './xpath-evaluation.js';

async function handleResponse(fxInstance, response) {
  const { status } = response;
  if (status >= 400) {
    // console.log('response status', status);
    alert(`response status:  ${status} - failed to load data for '${fxInstance.src}' - stopping.`);
    throw new Error(`failed to load data - status: ${status}`);
  }
  const responseContentType = response.headers.get('content-type').toLowerCase();
  // console.log('********** responseContentType *********', responseContentType);
  if (responseContentType.startsWith('text/html')) {
    // const htmlResponse = response.text();
    // return new DOMParser().parseFromString(htmlResponse, 'text/html');
    // return response.text();
    return response.text().then(result =>
      // console.log('xml ********', result);
      new DOMParser().parseFromString(result, 'text/html'),
    );
  }
  if (responseContentType.startsWith('text/')) {
    // console.log("********** inside  res plain *********");
    return response.text();
  }
  if (responseContentType.startsWith('application/json')) {
    // console.log("********** inside res json *********");
    return response.json();
  }
  if (
    responseContentType.startsWith('application/xml') ||
    responseContentType.startsWith('text/xml')
  ) {
    // See https://www.rfc-editor.org/rfc/rfc7303
    const text = await response.text();
    // console.log('xml ********', result);
    return new DOMParser().parseFromString(text, 'application/xml');
  }
  throw new Error(`unable to handle response content type: ${responseContentType}`);
}

/**
 * Container for data instances.
 *
 * Offers several ways of loading data from either inline content or via 'src' attribute which will use the fetch
 * API to resolve data.
 */
export class FxInstance extends HTMLElement {
  constructor() {
    super();
    this.model = this.parentNode;
    this.attachShadow({ mode: 'open' });
    this.originalInstance = null;
    this.partialInstance = null;
    this.credentials = '';
  }

  connectedCallback() {
    // console.log('connectedCallback ', this);
    if (this.hasAttribute('src')) {
      this.src = this.getAttribute('src');
    }

    if (this.hasAttribute('id')) {
      this.id = this.getAttribute('id');
    } else {
      this.id = 'default';
    }

    this.credentials = this.hasAttribute('credentials')
      ? this.getAttribute('credentials')
      : 'same-origin';
    if (!['same-origin', 'include', 'omit'].includes(this.credentials)) {
      console.error(
        `fx-submission: the value of credentials is not valid. Expected 'same-origin', 'include' or 'omit' but got '${this.credentials}'`,
        this,
      );
    }

    if (this.hasAttribute('type')) {
      this.type = this.getAttribute('type');
    } else {
      this.type = 'xml';
      this.setAttribute('type', this.type);
    }
    const style = `
            :host {
                display: none;
            }
            :host * {
                display:none;
            }
            ::slotted(*){
                display:none;
            }
        `;

    const html = `
        `;
    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
        `;
    this.partialInstance = {};
  }

  /**
   * Is called by fx-model during initialization phase (model-construct)
   * @returns {Promise<void>}
   */
  async init() {
    // console.log('fx-instance init');
    await this._initInstance();
    console.log(`### <<<<< instance ${this.id} loaded >>>>> `);
    this.dispatchEvent(
      new CustomEvent('instance-loaded', {
        composed: true,
        bubbles: true,
        detail: { instance: this },
      }),
    );
    return this;
  }

  reset() {
    // this._useInlineData();
    this.instanceData = this.originalInstance.cloneNode(true);
  }

  evalXPath(xpath) {
    const formElement = this.parentElement.parentElement;
    const result = evaluateXPathToFirstNode(xpath, this.getDefaultContext(), formElement);
    return result;
  }

  /**
   * returns the current instance data
   *
   * @returns {Document | T | any}
   */
  getInstanceData() {
    if (!this.instanceData) {
      this.createInstanceData();
    }
    return this.instanceData;
  }

  setInstanceData(data) {
    if (!data) {
      this.createInstanceData();
      return;
    }
    this._setInitialData(data);
    // this.instanceData = data;
  }

  /**
   * return the default context (root node of respective instance) for XPath evalution.
   *
   * @returns {Document|T|any|Element}
   */
  getDefaultContext() {
    // Note: use the getter here: it might provide us with stubbed data if anything async is racing,
    // such as an @src attribute
    const instanceData = this.getInstanceData();
    if (this.type === 'xml') {
      return instanceData.firstElementChild;
    }
    return instanceData;
  }

  /**
   * does the actual loading of data. Handles inline data, data loaded via fetch() or data constructed from
   * querystring.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _initInstance() {
    if (this.src === '#querystring') {
      /*
       * generate XML data from URL querystring
       * todo: there's no variant to generate JSON yet
       */
      // eslint-disable-next-line no-restricted-globals
      const query = new URLSearchParams(location.search);
      const doc = new DOMParser().parseFromString('<data></data>', 'application/xml');
      const root = doc.firstElementChild;
      for (const p of query) {
        const newNode = doc.createElement(p[0]);
        newNode.appendChild(doc.createTextNode(p[1]));
        root.appendChild(newNode);
      }
      this._setInitialData(doc);
      /*
      this.instanceData = doc;
      this.originalInstance = this.instanceData.cloneNode(true);
*/
      // this.instanceData.firstElementChild.setAttribute('id', this.id);
      // resolve('done');
    } else if (this.src) {
      await this._loadData();
    } else if (this.childNodes.length !== 0) {
      this._useInlineData();
    }
  }

  createInstanceData() {
    if (this.type === 'xml') {
      // const doc = new DOMParser().parseFromString('<data data-id="default"></data>', 'application/xml');
      const doc = new DOMParser().parseFromString('<data></data>', 'application/xml');
      this.instanceData = doc;
      this.originalInstance = this.instanceData.cloneNode(true);
    }
    if (this.type === 'json') {
      this.instanceData = {};
      this.originalInstance = [...this.instanceData];
    }
    if (this.type === 'text') {
      this.instanceData = '';
      this.originalInstance = '';
    }
  }

  async _loadData() {
    const url = `${this.src}`;

    if (url.startsWith('localStore')) {
      const key = url.substring(url.indexOf(':') + 1);

      const doc = new DOMParser().parseFromString('<data></data>', 'application/xml');
      this.instanceData = doc;
      // ### does it make sense to store originalData here?

      if (!key) {
        console.warn('no key specified for localStore');
        return;
      }

      const serialized = localStorage.getItem(key);
      if (!serialized) {
        console.warn(`Data for key ${key} cannot be found`);
        this._useInlineData();
        return;
      }
      const data = new DOMParser().parseFromString(serialized, 'application/xml');
      // let data = this._parse(serialized, instance);
      doc.firstElementChild.replaceWith(data.firstElementChild);
      return;
    }
    const contentType = Fore.getContentType(this, 'get');

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: this.credentials,
        mode: 'cors',
        headers: {
          'Content-Type': contentType,
        },
      });
      const data = await handleResponse(this, response);
      this._setInitialData(data);
      /*
      if (data.nodeType) {
        this._setInitialData(data);
        this.instanceData = data;
        this.originalInstance = this.instanceData.cloneNode(true);
        console.log('instanceData loaded: ', this.id, this.instanceData);
        return;
      }
      this.instanceData = data;
      this.originalInstance = [...data];
*/
    } catch (error) {
      throw new Error(`failed loading data ${error}`);
    }
  }

  _setInitialData(data) {
    this.instanceData = data;
    if (data.nodeType) {
      this.originalInstance = this.instanceData.cloneNode(true);
    } else {
      this.originalInstance = { ...this.instanceData };
    }
  }

  _getContentType() {
    if (this.type === 'xml') {
      return 'application/xml';
    }
    if (this.type === 'json') {
      return 'application/json';
    }
    console.warn('content-type unknown ', this.type);
    return null;
  }

  _useInlineData() {
    if (this.type === 'xml') {
      // console.log('innerHTML ', this.innerHTML);
      const instanceData = new DOMParser().parseFromString(this.innerHTML, 'application/xml');

      // console.log('fx-instance init id:', this.id);
      // this.instanceData = instanceData;
      this._setInitialData(instanceData);
      // console.log('instanceData ', this.instanceData);
      // console.log('instanceData ', this.instanceData.firstElementChild);

      // console.log('fx-instance data: ', this.instanceData);
      // this.instanceData.firstElementChild.setAttribute('id', this.id);
      // todo: move innerHTML out to shadowDOM (for later reset)
    } else if (this.type === 'json') {
      // this.instanceData = JSON.parse(this.textContent);
      this._setInitialData(JSON.parse(this.textContent));
    } else if (this.type === 'html') {
      // this.instanceData = this.firstElementChild.children;
      this._setInitialData(this.firstElementChild.children);
    } else if (this.type === 'text') {
      // this.instanceData = this.textContent;
      this._setInitialData(this.textContent);
    } else {
      console.warn('unknow type for data ', this.type);
    }
  }

  // _handleResponse() {
  //   console.log('_handleResponse ');
  //   const ajax = this.shadowRoot.getElementById('loader');
  //   const instanceData = new DOMParser().parseFromString(ajax.lastResponse, 'application/xml');
  //   this.instanceData = instanceData;
  //   console.log('data: ', this.instanceData);
  // }

  /*
  _handleError() {
    const loader = this.shadowRoot.getElementById('loader');
    console.log('_handleResponse ', loader.lastError);
  }
*/
}
if (!customElements.get('fx-instance')) {
  customElements.define('fx-instance', FxInstance);
}
