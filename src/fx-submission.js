import { Fore } from './fore.js';
import { Relevance } from './relevance.js';
import { evaluateXPath } from './xpath-evaluation.js';
import ForeElementMixin from './ForeElementMixin.js';

/**
 * todo: validate='false'
 */
export class FxSubmission extends ForeElementMixin {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.credentials = '';
    this.parameters = new Map();
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

    this.mediatype = this.hasAttribute('mediatype')
      ? this.getAttribute('mediatype')
      : 'application/xml';

    this.responseMediatype = this.hasAttribute('responsemediatype')
      ? this.getAttribute('responsemediatype')
      : this.mediatype;
    this.url = this.hasAttribute('url') ? this.getAttribute('url') : null;

    this.targetref = this.hasAttribute('targetref') ? this.getAttribute('targetref') : null;

    this.validate = this.getAttribute('validate') ? this.getAttribute('validate') : 'true';
    this.credentials = this.hasAttribute('credentials')
      ? this.getAttribute('credentials')
      : 'same-origin';
    if (!['same-origin', 'include', 'omit'].includes(this.credentials)) {
      console.error(
        `fx-submission: the value of credentials is not valid. Expected 'same-origin', 'include' or 'omit' but got '${this.credentials}'`,
        this,
      );
    }
    this.shadowRoot.innerHTML = this.renderHTML();
  }

  // eslint-disable-next-line class-methods-use-this
  renderHTML() {
    return `
      <slot></slot>
    `;
  }

  async submit() {
    await Fore.dispatch(this, 'submit', { submission: this });
    await this._submit();
  }

  async _submit() {
    console.info(`🚀 #${this.id}`);

    this.evalInContext();
    const model = this.getModel();

    model.recalculate();

    if (this.validate === 'true' && this.method !== 'get') {
      const valid = model.revalidate();
      if (!valid) {
        console.log('validation failed. Submission stopped');
        this.getOwnerForm().classList.add('submit-validation-failed');
        // ### allow alerts to pop up
        // this.dispatch('submit-error', {});
        Fore.dispatch(this, 'submit-error', { status: 0, message: 'validation failed' });
        this.getModel().parentNode.refresh(true);
        return;
      }
    }
    await this._serializeAndSend();
  }

  _getProperty(attrName) {
    if (this.parameters.has(attrName)) {
      return this.parameters.get(attrName);
    }
    return this.getAttribute(attrName);
  }

  /**
   * sends the data after evaluating
   *
   * @private
   */
  async _serializeAndSend() {
    const url = this._getProperty('url');
    const resolvedUrl = this.evaluateAttributeTemplateExpression(url, this);

    const instance = this.getInstance();
    if (!instance) {
      Fore.dispatch(this, 'warn', { message: `instance not found ${instance?.getAttribute?.('id')}` });
    }
    const instType = instance.getAttribute('type');

    let serialized;
    if (this.serialization === 'none') {
      serialized = undefined;
    } else {
      const relevant = Relevance.selectRelevant(this, instType);
      serialized = this._serialize(instType, relevant);
    }

    if (this.method.toLowerCase() === 'get') {
      serialized = undefined;
    }

    // --- echo / localStore shortcuts ---
    if (resolvedUrl.startsWith('#echo')) {
      if (this.replace === 'download') {
        await this._handleResponse(serialized, resolvedUrl, 'application/xml');
      } else {
        const data = this._parse(serialized, instance);
        await this._handleResponse(data, resolvedUrl, 'application/xml');
      }
      console.log('### <<<<< submit-done >>>>>');
      Fore.dispatch(this, 'submit-done', {});
      this.parameters.clear();
      return;
    }

    if (resolvedUrl.startsWith('localStore:')) {
      if (this.method === 'get' || this.method === 'consume') {
        this.replace = 'instance';
        const key = resolvedUrl.substring(resolvedUrl.indexOf(':') + 1);
        const stored = localStorage.getItem(key);
        if (!stored) {
          Fore.dispatch(this, 'submit-error', {
            status: 400,
            message: `Error reading key ${key} from localstorage`,
          });
          this.parameters.clear();
          return;
        }
        const data = this._parse(stored, instance);
        await this._handleResponse(data);
        if (this.method === 'consume') {
          localStorage.removeItem(key);
        }
        console.log('### <<<<< submit-done >>>>>');
        Fore.dispatch(this, 'submit-done', {});
      }

      if (this.method === 'post') {
        const key = resolvedUrl.substring(resolvedUrl.indexOf(':') + 1);
        localStorage.setItem(key, serialized);
        await this._handleResponse(instance.instanceData);
        console.log('### <<<<< submit-done >>>>>');
        Fore.dispatch(this, 'submit-done', {});
      }

      if (this.method === 'delete') {
        const key = resolvedUrl.substring(resolvedUrl.indexOf(':') + 1);
        localStorage.removeItem(key);
        const newInst = new DOMParser().parseFromString('<data></data>', 'application/xml');
        this.replace = 'instance';
        await this._handleResponse(newInst);
        console.log('### <<<<< submit-done >>>>>');
        Fore.dispatch(this, 'submit-done', {});
      }

      return;
    }

    // --- network fetch ---
    const headers = this._getHeaders();

    if (!this.methods.includes(this.method.toLowerCase())) {
      Fore.dispatch(this, 'error', { message: `Unknown method ${this.method}` });
      return;
    }

    try {
      const response = await fetch(resolvedUrl, {
        method: this.method,
        credentials: this.credentials,
        mode: 'cors',
        headers,
        body: serialized,
      });

      if (!response.ok || response.status > 400) {
        console.info(
            `%csubmit-error #${this.id}`,
            'background:red; color:black; padding:.5rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;width:100%;',
        );

        Fore.dispatch(this, 'submit-error', {
          status: response.status,
          message: `Error during submit ${this.id}`,
        });
        return;
      }

      const contentType = response.headers.get('content-type').split(';')[0].trim().toLowerCase();

      if (contentType.endsWith('/xml') || contentType.endsWith('+xml')) {
        const text = await response.text();
        const xml = new DOMParser().parseFromString(text, 'application/xml');
        await this._handleResponse(xml, resolvedUrl, contentType);
      } else if (contentType.startsWith('text/')) {
        const text = await response.text();
        await this._handleResponse(text, resolvedUrl, contentType);
      } else if (contentType.endsWith('/json') || contentType.endsWith('+json')) {
        const json = await response.json();
        await this._handleResponse(json, resolvedUrl, contentType);
      } else {
        const blob = await response.blob();
        await this._handleResponse(blob, resolvedUrl, contentType);
      }

      Fore.dispatch(this, 'submit-done', {});
    } catch (error) {
      Fore.dispatch(this, 'submit-error', { status: 500, error: error.message });
    } finally {
      this.parameters.clear();
      const download = document.querySelector('[download]');
      if (download) {
        document.body.removeChild(download);
      }
    }
  }

  _parse(serialized, instance) {
    let data = null;
    if (serialized && instance.getAttribute('type') === 'xml') {
      data = new DOMParser().parseFromString(serialized, 'application/xml');
    }
    if (serialized && instance.getAttribute('type') === 'json') {
      data = JSON.parse(serialized);
    }
    if (serialized && instance.getAttribute('type') === 'text') {
      data = serialized;
    }
    return data;
  }

  /**
   * Serialize the submission payload depending on instance type.
   *
   * - XML instances => XML serialization (existing behavior)
   * - JSON instances => JSON serialization from plain JS (NOT from JSONNode lens objects)
   *
   * @param {import('./fx-instance.js').FxInstance | null} instanceEl
   * @param {any} data
   * @returns {string}
   */
  _serialize(instanceEl, data) {
    // If the caller passed an explicit "data", prefer it; otherwise serialize the instance.
    let payload = data;

    // Resolve instance if not provided explicitly
    if (!instanceEl) {
      const model = this.getOwnerForm()?.getModel?.();
      const instanceId = this.getAttribute('instance') || 'default';
      instanceEl = model?.getInstance?.(instanceId) || null;
    }

    // If no payload was passed, derive it from instance default context/nodeset
    if (payload == null && instanceEl) {
      payload =
          (typeof instanceEl.getDefaultContext === 'function' && instanceEl.getDefaultContext()) ||
          instanceEl.nodeset ||
          null;
    }

    // Decide JSON vs XML by instance type (NOT by ref expression)
    const isJsonInstance = instanceEl?.getAttribute?.('type') === 'json' || instanceEl?.type === 'json';

    if (isJsonInstance) {
      // Convert JSON lens nodes to plain JS before stringify
      const plain = this._toPlainJson(payload);
      // NOTE: you can pass spacing here if you want pretty output:
      // return JSON.stringify(plain, null, 2);
      return JSON.stringify(plain);
    }

    // --- XML / default path ---
    // Keep existing XML behavior: if payload is a DOM node/document, serialize as XML.
    // If payload is a string, return as-is.
    if (typeof payload === 'string') return payload;

    try {
      if (payload && payload.nodeType) {
        // Document => serialize documentElement, Node => serialize node
        const node =
            payload.nodeType === Node.DOCUMENT_NODE ? payload.documentElement : payload;
        return new XMLSerializer().serializeToString(node);
      }
    } catch (_e) {
      // fallthrough
    }

    // As a last resort for non-XML odd payloads:
    return String(payload ?? '');
  }

  /**
   * Convert a JSON lens node (JSONNode) or other value into plain JSON (no circular refs).
   * This must NEVER return JSONNode objects.
   *
   * @param {any} v
   * @returns {any} plain JSON value
   */
  _toPlainJson(v) {
    if (v == null) return null;

    // If it's already a plain primitive, keep it
    const t = typeof v;
    if (t === 'string' || t === 'number' || t === 'boolean') return v;

    // JSON lens node (your JSONNode objects)
    if (v.__jsonlens__ === true) {
      return this._jsonLensNodeToPlain(v);
    }

    // Arrays: convert elements
    if (Array.isArray(v)) {
      return v.map(x => this._toPlainJson(x));
    }

    // Plain objects: best-effort convert (should be rare here)
    // Avoid circular refs by only copying own enumerable props.
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      out[k] = this._toPlainJson(val);
    }
    return out;
  }

  /**
   * Convert a single JSON lens node (JSONNode) into a plain JS value by traversing children.
   *
   * Assumptions (based on your JSON lens structure):
   * - node.value holds the underlying JS value for leaf nodes
   * - node.children is an array for arrays/objects
   * - node.get(keyOrIndex) returns child node for objects/arrays
   *
   * This function intentionally does NOT touch node.parent.
   *
   * @param {any} node JSONNode
   * @returns {any}
   */
  _jsonLensNodeToPlain(node) {
    // If node.value is a primitive or null, return it
    // (Many JSON lens implementations store actual scalar in .value)
    const val = node.value;

    if (
        val === null ||
        val === undefined ||
        typeof val === 'string' ||
        typeof val === 'number' ||
        typeof val === 'boolean'
    ) {
      return val ?? null;
    }

    // If the node represents an array
    if (Array.isArray(val)) {
      // Prefer node.children if present; fall back to val (might be raw JS)
      const kids = Array.isArray(node.children) ? node.children : val;
      return kids.map(child => this._toPlainJson(child));
    }

    // If the node represents an object
    if (typeof val === 'object') {
      // If this is already a plain JS object (not a JSONNode), convert it
      // but in lens setups val might be plain object while children are lens nodes.
      const result = {};

      // Prefer iterating keys from val
      for (const key of Object.keys(val)) {
        // Try lens navigation first
        if (typeof node.get === 'function') {
          const child = node.get(key);
          result[key] = this._toPlainJson(child ?? val[key]);
        } else {
          result[key] = this._toPlainJson(val[key]);
        }
      }

      return result;
    }
1
    // Fallback: last-resort scalar conversion
    try {
      if (typeof node.get === 'function') {
        // Some lens nodes return scalar via get()
        return this._toPlainJson(node.get());
      }
    } catch (_e) {
      // ignore
    }

    return String(val);
  }

  _getHeaders() {
    const headers = new Headers();

    // ### set content-type header according to type of instance
    const instance = this.getInstance();
    const contentType = Fore.getContentType(instance, this.serialization);
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
  async _handleResponse(data, resolvedUrl, contentType) {
    const targetInstance = this._getTargetInstance();

    if (this.replace === 'instance') {
      // ### contentType handling (HTML special-case)
      if (contentType && contentType.includes('html')) {
        let effectiveData = data;
        if (!data?.nodeType) {
          try {
            effectiveData = new DOMParser().parseFromString(data, 'text/html');
          } catch {
            Fore.dispatch(this, 'error', { message: 'could not parse data as HTML' });
          }
        }
        targetInstance.instanceData = effectiveData;
      }

      if (!targetInstance) {
        throw new Error(`target instance not found: ${targetInstance}`);
      }

      if (this.targetref) {
        const [theTarget] = evaluateXPath(
            this.targetref,
            targetInstance.instanceData.firstElementChild,
            this,
        );

        if (
            this.responseMediatype === 'application/xml' ||
            this.responseMediatype === 'text/html'
        ) {
          const clone = data.firstElementChild;
          const parent = theTarget.parentNode;
          parent.replaceChild(clone, theTarget);
        }
        if (this.responseMediatype && this.responseMediatype.startsWith('text/')) {
          theTarget.textContent = data;
        }
        if (this.responseMediatype === 'application/json') {
          console.warn('targetref is not supported for application/json responses');
        }
      } else if (this.into) {
        const [theTarget] = evaluateXPath(
            this.into,
            targetInstance.instanceData.firstElementChild,
            this,
        );
        if (data?.nodeType === Node.DOCUMENT_NODE) {
          theTarget.appendChild(data.firstElementChild);
        } else {
          theTarget.innerHTML = data;
        }
      } else {
        // ✅ This is the critical replace="instance" case
        targetInstance.instanceData = data;
      }

      // Skip any refreshes if the model is not yet inited
      if (this.model.inited) {
        // Rebuild model items / binds against the new instance root
        this.model.updateModel();

        // ✅ treat instance replacement as a structural change
        const fore =
            (typeof this.getOwnerForm === 'function' && this.getOwnerForm()) ||
            this.closest('fx-fore') ||
            this.getModel()?.parentNode;

        if (fore) {
          fore.someInstanceDataStructureChanged = true;
          if (typeof fore.scanForNewTemplateExpressionsNextRefresh === 'function') {
            fore.scanForNewTemplateExpressionsNextRefresh();
          }
          // ✅ IMPORTANT: await, otherwise tests/action-pipeline can out-run the refresh
          await fore.refresh(true);
        }
      }

      return;
    }

    if (this.replace === 'download') {
      const target = this._getProperty('target');
      if (!target) {
        throw new Error(`${this.id} needs to specify "target" attribute`);
      }
      const downloadLink = document.createElement('a');
      downloadLink.setAttribute('download', target);
      downloadLink.setAttribute('href', `data:${contentType},${encodeURIComponent(data)}`);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      return;
    }

    if (this.replace === 'all') {
      const target = this._getProperty('target');
      if (target && target === '_blank') {
        const win = window.open('', '_blank');
        win.document.write(`<pre>${data}</pre>`);
        win.document.close();
      } else {
        document.open();
        document.write(data);
        document.close();
        window.location.href = resolvedUrl;
      }
      return;
    }

    if (this.replace === 'target') {
      const target = this._getProperty('target');
      const targetNode = document.querySelector(target);
      if (targetNode) {
        if (contentType && contentType.startsWith('text/html')) {
          targetNode.innerHTML = data;
        }
        if (this.responseMediatype && this.responseMediatype.startsWith('image/svg')) {
          const objectURL = URL.createObjectURL(data);
          targetNode.src = objectURL;
        }
      } else {
        Fore.dispatch(this, 'submit-error', {
          message: `targetNode for selector ${target} not found`,
        });
      }
      return;
    }

    if (this.replace === 'redirect') {
      window.location.href = data;
    }
  }
  /*
  _handleError() {
    // this.dispatch('submit-error', {});
    Fore.dispatch(this, 'submit-error', {});
    /!*
                    console.log('ERRRORRRRR');
                    this.dispatchEvent(
                        new CustomEvent('submit-error', {
                            composed: true,
                            bubbles: true,
                            detail: {},
                        }),
                    );
            *!/
  }
*/

  /*
    mergeNodes(node1, node2) {
        // Overwrite attributes in node1 with values from node2
        for (const { name, value } of node2.attributes) {
            node1.setAttribute(name, value);
        }

        const childNodes1 = Array.from(node1.childNodes);
        const childNodes2 = Array.from(node2.childNodes);

        // Append all child nodes from node2 to node1
        childNodes2.forEach(child2 => {
            if (child2.nodeType === 1) {
                // If it's an element node, check if a matching element exists in node1
                const matchingElement = childNodes1.find(
                    child1 => child1.nodeType === 1 && child1.tagName === child2.tagName
                );
                if (matchingElement) {
                    this.mergeNodes(matchingElement, child2); // Recursively merge matching elements
                } else {
                    const clonedNode = child2.cloneNode(true);
                    node1.appendChild(clonedNode);
                }
            } else {
                // For text nodes, simply append them to node1
                const clonedNode = child2.cloneNode(true);
                node1.appendChild(clonedNode);
            }
        });
    }
*/
}

if (!customElements.get('fx-submission')) {
  customElements.define('fx-submission', FxSubmission);
}
