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
  const responseContentType = response.headers
    .get('content-type')
    .split(';')[0]
    .trim()
    .toLowerCase();

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
 *
 * @element fx-instance

 * @attr {string} [id] - The ID of the instance.
 * @attr {"xml"|"json"|"html"|"text"} [type=xml] - Serialisation format of the instance. Defaults to
 * `xml` since that's most common. Inline `xml` works when the markup is plain (lower-case names, no
 * namespaces, no self-closing elements): the browser's HTML parser lower-cases names, drops
 * namespace handling and expands self-closing elements (`<foo/>`) before Fore ever sees the
 * content. For inline XML that relies on any of those, wrap the data in
 * `<script type="application/xml">…</script>` (raw text to the HTML parser, nothing is altered) or
 * load it with @src. `json`, `html` and `text` inline without caveats.
 * @attr {string | "#querystring" | `localStore:${string}`} [src] - The external source to fetch
 * when loading this instance. Can be from the query-string as well, or indicating a localstorage
 * store
 * @attr {boolean} [shared=false] - Whether this instance will be shared with any sub fx-fore elements.
 * @attr {"same-origin"|"include"|"omit"} [credentials="same-origin"] - The credentials to use when fetching an external resource
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

    this.debugInfo = {
      debugId: `instance-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: performance.now(),
      initializedAt: null,
      loadCount: 0,
      /*
      mutationCount: 0,
      lastMutationAt: null,
*/
    };
  }

  getDebugInfo() {
    const defaultContext = this.getDefaultContext?.();

    return {
      ...this.debugInfo,
      id: this.getAttribute('id') || null,
      instanceId: this.instanceId,
      type: this.type,
      src: this.getAttribute('src') || null,
      shared: this.hasAttribute('shared'),
      hasData: !!this.instanceData,
      hasNodeset: !!this.nodeset,
      defaultContextType: defaultContext?.nodeType
        ? 'xml-node'
        : defaultContext?.__jsonlens__
          ? 'json-lens'
          : typeof defaultContext,
    };
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
      this.parentNode &&
      this.parentNode.nodeName &&
      this.parentNode.nodeName.toUpperCase() === 'FX-MODEL'
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
    // this.debugInfo.mutationCount += 1;
    // this.debugInfo.lastMutationAt = performance.now();
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
    // this.debugInfo.mutationCount += 1;
    // this.debugInfo.lastMutationAt = performance.now();
    // use the setter so nodeset is rebuilt for JSON too
    if (this.originalInstance && (this.type === 'xml' || this.type === 'html')) {
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
    // this.debugInfo.mutationCount += 1;
    // this.debugInfo.lastMutationAt = performance.now();
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
    this.debugInfo.initializedAt = performance.now();
    this.debugInfo.loadCount += 1;
  }

  createInstanceData() {
    this._invalidateInstanceVarBindings();
    switch (this.type) {
      case 'xml':
      case 'html': {
        const doc = new DOMParser().parseFromString('<data></data>', `text/${this.type}`);
        this._instanceData = doc;
        this.originalInstance = doc.cloneNode(true);
        this.nodeset = doc;

        break;
      }

      case 'json':
        this._instanceData = {};
        this.originalInstance = { ...this._instanceData };
        this.nodeset = wrapJson(this._instanceData, null, null, this.foreId);
        this.domFacade = new JSONDomFacade();
        break;

      case 'text':
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

  /**
   * The owning fore caches implicit $default/$<instance-id> variable bindings
   * (_instanceVarBindings). After a data replacement they would still point into the
   * previous document — drop the cache so getVariablesInScope rebuilds it lazily
   * against the current data.
   *
   * @private
   */
  _invalidateInstanceVarBindings() {
    const fore = this.closest('fx-fore');
    if (fore && fore._instanceVarBindings) {
      fore._instanceVarBindings = null;
    }
  }

  _setInitialData(data) {
    this._invalidateInstanceVarBindings();
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

  /**
   * A single `<script type="application/xml">` (or `text/xml`, or `*+xml`) child is raw text to the
   * HTML parser: capitalisation, namespaces and self-closing elements all survive verbatim. Return
   * that script so its `.textContent` can be handed straight to an XML parser, or `null`.
   *
   * @returns {HTMLScriptElement | null}
   * @private
   */
  _getInlineXmlScript() {
    const children = Array.from(this.children);
    if (children.length !== 1 || children[0].localName !== 'script') {
      return null;
    }
    const scriptType = (children[0].getAttribute('type') || '').trim().toLowerCase();
    const isXmlType = /^(application|text)\/xml$/.test(scriptType) || /\+xml$/.test(scriptType);
    return isXmlType ? children[0] : null;
  }

  /**
   * Inspect inline content of an `xml` instance for constructs the browser's HTML parser alters
   * before Fore can read them. Best-effort: namespace prefixes/declarations and non-nesting HTML
   * elements are detectable here, but capitalisation and self-closing elements (`<foo/>`) are
   * already lost by the time this runs and cannot be flagged.
   *
   * @returns {string[]} human-readable descriptions of detected hazards
   * @private
   */
  _detectInlineXmlHazards() {
    // A `<script type="application/xml">` wrapper is lossless — nothing to warn about.
    if (this._getInlineXmlScript()) {
      return [];
    }

    const VOID_ELEMENTS = new Set([
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
    ]);
    const HTML_STRUCTURE = new Set(['html', 'head', 'body', 'tbody']);

    const hazards = new Set();
    for (const el of this.querySelectorAll('*')) {
      const name = el.localName;
      if (name.includes(':')) {
        hazards.add(`namespace-prefixed element <${name}>`);
      }
      if (VOID_ELEMENTS.has(name)) {
        hazards.add(`<${name}> is a void element in HTML and cannot hold children`);
      }
      if (HTML_STRUCTURE.has(name)) {
        hazards.add(`<${name}> triggers HTML document-structure parsing`);
      }
      for (const attr of el.getAttributeNames()) {
        if (attr === 'xmlns' || attr.startsWith('xmlns:')) {
          hazards.add(`namespace declaration @${attr}`);
        } else if (attr.includes(':')) {
          hazards.add(`namespace-prefixed attribute @${attr}`);
        }
      }
    }
    return [...hazards];
  }

  _useInlineData() {
    if (this.type === 'xml') {
      const xmlScript = this._getInlineXmlScript();
      if (xmlScript) {
        const parsed = new DOMParser().parseFromString(xmlScript.textContent, 'application/xml');
        const parseError = parsed.querySelector('parsererror');
        if (parseError) {
          const message = `The inline instance "${this.id}" contains malformed XML: ${parseError.textContent.trim()}`;
          console.error(message);
          Fore.dispatch(this, 'message', { level: 'error', message });
        }
        this._setInitialData(parsed);
        return;
      }

      const hazards = this._detectInlineXmlHazards();
      if (hazards.length) {
        const message = `The inline instance "${this.id}" is type "xml" but its markup contains constructs the HTML parser alters before Fore can read them: ${hazards.join('; ')}. Wrap the data in <script type="application/xml">…</script> (raw text, nothing is altered), load it via @src, or use type="json"/"html" if that is the real format. Capitalisation and self-closing elements (<foo/>) are corrupted the same way but cannot be detected here.`;
        console.error(message);
        Fore.dispatch(this, 'message', { level: 'error', message });
      }

      const instanceData = new DOMParser().parseFromString(this.innerHTML, 'application/xml');
      this._setInitialData(instanceData);
    } else if (this.type === 'json') {
      // Use innerHTML (not textContent) so HTML tags the browser parser consumed as
      // child elements (e.g. <blockquote> in a string value) are serialized back to text.
      // Then escape literal control characters that JSON.parse rejects inside strings.
      const sanitized = this.innerHTML.replace(/("(?:[^"\\]|\\.)*")/gs, match =>
        match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t'),
      );
      this._setInitialData(JSON.parse(sanitized));
    } else if (this.type === 'html') {
      const newDocumentFragment = new Document();
      newDocumentFragment.appendChild(this.firstElementChild.cloneNode(true));
      this._setInitialData(newDocumentFragment);
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
