import { Fore } from './fore.js';
import { evaluateXPathToFirstNode } from './xpath-evaluation.js';
import { wrapJson } from './json/JSONNode.js';
import { JSONDomFacade } from './json/JSONDomFacade.js';

async function handleResponse(fxInstance, response) {
  const { status } = response;
  if (status >= 400) {
    alert(`response status:  ${status} - failed to load data for '${fxInstance.src}' - stopping.`);
    throw new Error(`failed to load data - status: ${status}`);
  }
  let responseContentType = response.headers.get('content-type').split(';')[0].trim().toLowerCase();

  if (responseContentType.startsWith('text/html')) {
    return response.text().then(result => new DOMParser().parseFromString(result, 'text/html'));
  }
  if (responseContentType.endsWith('/json') || responseContentType.endsWith('+json')) {
    return response.json();
  }
  if (responseContentType.endsWith('/xml') || responseContentType.endsWith('+xml')) {
    const text = await response.text();
    return new DOMParser().parseFromString(text, 'application/xml');
  }
  if (responseContentType.startsWith('text/')) {
    return response.text();
  }

  throw new Error(`unable to handle response content type: ${responseContentType}`);
}

/**
 * Container for data instances.
 */
export class FxInstance extends HTMLElement {
  constructor() {
    super();
    this.model = this.parentNode;
    this.attachShadow({ mode: 'open' });

    this.originalInstance = null;
    this.partialInstance = null;
    this.credentials = '';

    // IMPORTANT: keep backing store private so setter can intercept updates
    this._instanceData = null;

    // Lens nodeset for JSON, DOM Document for XML
    this.nodeset = null;

    // JSON facade (only relevant for JSON instances)
    this.domFacade = null;
  }

  connectedCallback() {
    if (this.hasAttribute('src')) {
      this.src = this.getAttribute('src');
    }

    // Default instance selection is positional:
    // The first <fx-instance> child (doc order) of the owning <fx-model> is the default instance.
    // If the author did not provide an id on that first instance, we set id="default".
    // If the author provided an id on that first instance, we use that id instead.
    const parentModel =
      this.parentNode && this.parentNode.nodeName && this.parentNode.nodeName.toUpperCase() === 'FX-MODEL'
        ? this.parentNode
        : null;

    const explicitId = (this.getAttribute('id') || '').trim();

    let isFirstInModel = false;
    if (parentModel) {
      const instances = Array.from(parentModel.children).filter(
        el => el && el.nodeType === Node.ELEMENT_NODE && el.localName === 'fx-instance',
      );
      isFirstInModel = instances.length > 0 && instances[0] === this;
    } else {
      // Standalone <fx-instance> in tests/fixtures: treat as default.
      isFirstInModel = true;
    }

    if (isFirstInModel) {
      // First instance defines the default instance
      const effectiveId = explicitId || 'default';
      this.instanceId = effectiveId;
      // For backwards compatibility/tests, reflect as DOM id.
      this.id = effectiveId;
    } else {
      // Non-first instances are only addressable by id if explicitly provided.
      this.instanceId = explicitId || '';
      if (explicitId) {
        this.id = explicitId;
      }
    }

    this.credentials = this.hasAttribute('credentials') ? this.getAttribute('credentials') : 'same-origin';
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
      :host { display: none; }
      :host * { display:none; }
      ::slotted(*){ display:none; }
    `;

    this.shadowRoot.innerHTML = `<style>${style}</style>`;
    this.partialInstance = {};
  }

  /**
   * Logical Fore instance identifier (NOT the HTML id).
   * Prefer `instanceId` internally.
   */
  get foreId() {
    return this.instanceId || (this.hasAttribute('id') ? this.getAttribute('id') : 'default');
  }

  /**
   * IMPORTANT: canonical accessor for instance data.
   * Any code that assigns `instance.instanceData = ...` will now rebuild nodeset correctly.
   */
  get instanceData() {
    return this._instanceData;
  }

  set instanceData(data) {
    if (!data) {
      this.createInstanceData();
      return;
    }

    // Route ALL updates through _setInitialData so nodeset + originalInstance stay consistent
    this._setInitialData(data);

    // Signal structure mutation (used by fx-fore for refresh decisions)
    this.dispatchEvent(new CustomEvent('path-mutated', { bubbles: true, composed: true }));
  }

  /**
   * Is called by fx-model during initialization phase (model-construct)
   */
  async init() {
    await this._initInstance();
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
    // use the setter so nodeset is rebuilt for JSON too
    if (this.originalInstance && this.type === 'xml') {
      this.instanceData = this.originalInstance.cloneNode(true);
    } else if (this.originalInstance && this.type === 'json') {
      this.instanceData = structuredClone(this.originalInstance);
    } else {
      // fallback
      this.instanceData = this.originalInstance;
    }
  }

  evalXPath(xpath) {
    const formElement = this.parentElement.parentElement;
    const result = evaluateXPathToFirstNode(xpath, this.getDefaultContext(), formElement);
    return result;
  }

  /**
   * returns the current instance data
   */
  getInstanceData() {
    if (!this.instanceData) {
      this.createInstanceData();
    }
    return this.instanceData;
  }

  /**
   * legacy setter API: keep it, but forward to instanceData setter
   */
  setInstanceData(data) {
    this.instanceData = data;
  }

  /**
   * return the default context (root node of respective instance) for XPath evaluation.
   */
  getDefaultContext() {
    const instanceData = this.getInstanceData();
    if (this.type === 'xml' || this.type === 'html') {
      return instanceData?.firstElementChild;
    }
    // JSON: use wrapped tree as context item
    return this.nodeset;
  }

  async _initInstance() {
    if (this.src === '#querystring') {
      const query = new URLSearchParams(location.search);
      const doc = new DOMParser().parseFromString('<data></data>', 'application/xml');
      const root = doc.firstElementChild;
      for (const p of query) {
        const newNode = doc.createElement(p[0]);
        newNode.appendChild(doc.createTextNode(p[1]));
        root.appendChild(newNode);
      }
      this._setInitialData(doc);
    } else if (this.src) {
      await this._loadData();
    } else if (this.childNodes.length !== 0) {
      this._useInlineData();
    }
  }

  createInstanceData() {
    if (this.type === 'xml') {
      const doc = new DOMParser().parseFromString('<data></data>', 'application/xml');
      this._instanceData = doc;
      this.originalInstance = doc.cloneNode(true);
      this.nodeset = doc;
      return;
    }
    if (this.type === 'json') {
      this._instanceData = {};
      this.originalInstance = { ...this._instanceData };
      this.nodeset = wrapJson(this._instanceData, null, null, this.foreId);
      this.domFacade = new JSONDomFacade();
      return;
    }
    if (this.type === 'text') {
      this._instanceData = this.innerText;
      this.originalInstance = this.innerText;
      this.nodeset = null;
    }
  }

  async _loadData() {
    const url = `${this.src}`;

    if (url.startsWith('localStore')) {
      const key = url.substring(url.indexOf(':') + 1);

      const doc = new DOMParser().parseFromString('<data></data>', 'application/xml');
      this._instanceData = doc;

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
      doc.firstElementChild.replaceWith(data.firstElementChild);
      // IMPORTANT: keep nodeset consistent
      this._setInitialData(doc);
      return;
    }

    const contentType = Fore.getContentType(this, 'get');

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: this.credentials,
        mode: 'cors',
        headers: { 'Content-Type': contentType },
      });
      const data = await handleResponse(this, response);
      this._setInitialData(data);
    } catch (error) {
      throw new Error(`failed loading data ${error}`);
    }
  }

  _setInitialData(data) {
    // IMPORTANT: always store in backing field so getter/setter stays consistent
    this._instanceData = data;

    if (data?.nodeType) {
      // XML/HTML instance
      this.originalInstance = this._instanceData.cloneNode(true);
      this.nodeset = this._instanceData;
      // domFacade irrelevant
      return;
    }

    if (this.type === 'json') {
      // JSON instance
      this.originalInstance = structuredClone(this._instanceData);
      this.nodeset = wrapJson(this._instanceData, null, null, this.foreId);
      if (!this.domFacade) this.domFacade = new JSONDomFacade();
      return;
    }

    // text (or unknown)
    this.nodeset = null;
  }

  _useInlineData() {
    if (this.type === 'xml') {
      const instanceData = new DOMParser().parseFromString(this.innerHTML, 'application/xml');
      this._setInitialData(instanceData);
    } else if (this.type === 'json') {
      this._setInitialData(JSON.parse(this.textContent));
    } else if (this.type === 'html') {
      this._setInitialData(this.firstElementChild.children);
    } else if (this.type === 'text') {
      this._setInitialData(this.textContent);
    } else {
      console.warn('unknown type for data ', this.type);
    }
  }
}

if (!customElements.get('fx-instance')) {
  customElements.define('fx-instance', FxInstance);
}