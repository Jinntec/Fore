import { Fore } from './fore.js';
import { evaluateXPathToFirstNode } from './xpath-evaluation.js';

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

    if (this.hasAttribute('type')) {
      this.type = this.getAttribute('type');
    } else {
      this.type = 'xml';
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
  }

  /**
   * Is called by fx-model during initialization phase (model-construct)
   * @returns {Promise<void>}
   */
  async init() {
    // console.log('fx-instance init');
    await this._initInstance().then(() => {
      this.dispatchEvent(
        new CustomEvent('instance-loaded', {
          composed: true,
          bubbles: true,
          detail: { instance: this },
        }),
      );
      return this;
    });
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
      this._createInstanceData();
    }
    return this.instanceData;
  }

  setInstanceData(data) {
    if (!data) {
      this._createInstanceData();
      return;
    }
    this.instanceData = data;
  }

  /**
   * return the default context (root node of respective instance) for XPath evalution.
   *
   * @returns {Document|T|any|Element}
   */
  getDefaultContext() {
    // console.log('getDefaultContext ', this.instanceData.firstElementChild);
    if (this.type === 'xml') {
      return this.instanceData.firstElementChild;
    }
    return this.instanceData;
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
      this.instanceData = doc;
      // this.instanceData.firstElementChild.setAttribute('id', this.id);
      // resolve('done');
    } else if (this.src) {
      await this._loadData();
    } else if (this.childNodes.length !== 0) {
      this._useInlineData();
    }
  }

  _createInstanceData() {
    if (this.type === 'xml') {
      // const doc = new DOMParser().parseFromString('<data data-id="default"></data>', 'application/xml');
      const doc = new DOMParser().parseFromString('<data></data>', 'application/xml');
      this.instanceData = doc;
    }
    if (this.type === 'json') {
      this.instanceData = {};
    }
  }

  async _loadData() {
    const url = `${this.src}`;
    const contentType = Fore.getContentType(this, 'get');

    await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': contentType,
      },
    })
      .then(response => {
        const responseContentType = response.headers.get('content-type').toLowerCase();
        console.log('********** responseContentType *********', responseContentType);
        if (responseContentType.startsWith('text/html')) {
          // const htmlResponse = response.text();
          // return new DOMParser().parseFromString(htmlResponse, 'text/html');
          // return response.text();
          return response.text().then(result => {
            // console.log('xml ********', result);
            return new DOMParser().parseFromString(result, 'text/html');
          });

        }
        if (responseContentType.startsWith('text/plain') || responseContentType.startsWith('text/markdown')) {
          // console.log("********** inside  res plain *********");
          return response.text();
        }
        if (responseContentType.startsWith('application/json')) {
          // console.log("********** inside res json *********");
          return response.json();
        }
        if (responseContentType.startsWith('application/xml')) {
          return response.text().then(result => {
            // console.log('xml ********', result);
            return new DOMParser().parseFromString(result, 'application/xml');
          });
        }
        return 'done';
      })
      .then(data => {
        if(data.nodeType){
          this.instanceData = data;
          console.log('instanceData loaded: ', this.instanceData);
          return ;
        }
        this.instanceData = data;
      })
      .catch(error => {
        throw new Error(`failed loading data ${error}`);
      });
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

      console.log('fx-instance init id:', this.id);
      this.instanceData = instanceData;
      // console.log('instanceData ', this.instanceData);
      // console.log('instanceData ', this.instanceData.firstElementChild);

      console.log('fx-instance data: ', this.instanceData);
      // this.instanceData.firstElementChild.setAttribute('id', this.id);
      // todo: move innerHTML out to shadowDOM (for later reset)
    } else if (this.type === 'json') {
      this.instanceData = JSON.parse(this.textContent);
    } else if (this.type === 'html') {
      this.instanceData = this.firstElementChild.children;
    } else if (this.type === 'text') {
      this.instanceData = this.textContent;
    } else {
      console.warn('unknow type for data ', this.type);
    }
  }

  _handleResponse() {
    console.log('_handleResponse ');
    const ajax = this.shadowRoot.getElementById('loader');
    const instanceData = new DOMParser().parseFromString(ajax.lastResponse, 'application/xml');
    this.instanceData = instanceData;
    console.log('data: ', this.instanceData);
  }

  _handleError() {
    const loader = this.shadowRoot.getElementById('loader');
    console.log('_handleResponse ', loader.lastError);
  }
}
customElements.define('fx-instance', FxInstance);
