import {Fore} from './fore.js';
import {Relevance} from './relevance.js';
import {foreElementMixin} from './ForeElementMixin.js';
import {evaluateXPathToString, evaluateXPath} from './xpath-evaluation.js';
import getInScopeContext from './getInScopeContext.js';
import {XPathUtil} from "./xpath-util.js";

/**
 * todo: validate='false'
 */
export class FxSubmission extends foreElementMixin(HTMLElement) {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
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

        this.url = this.hasAttribute('url') ? this.getAttribute('url'):null;

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
        await Fore.dispatch(this, 'submit', {submission: this});
        await this._submit();
    }

    async _submit() {
        console.log('submitting....', this.getAttribute('id'));
        this.evalInContext();
        const model = this.getModel();

        model.recalculate();

        if (this.validate === 'true') {
            const valid = model.revalidate();
            if (!valid) {
                console.log('validation failed. Submission stopped');
                this.getOwnerForm().classList.add('submit-validation-failed');
                // ### allow alerts to pop up
                // this.dispatch('submit-error', {});
                Fore.dispatch(this, 'submit-error', {});
                this.getModel().parentNode.refresh(true);
                return;
            }
        }
        await this._serializeAndSend();
    }

    _getProperty(attrName){
        if(this.parameters.has(attrName)){
            return this.parameters.get(attrName);
        } else {
            return this.getAttribute(attrName);
        }
    }

    /**
     * sends the data after evaluating
     *
     * @private
     */
    async _serializeAndSend() {
        const url = this._getProperty('url');
        const resolvedUrl = this.evaluateAttributeTemplateExpression(url,this);
        console.log('resolvedUrl',resolvedUrl);
        const instance = this.getInstance();
        if (!instance) {
            Fore.dispatch(this, 'warn', {message: `instance not found ${instance.getAttribute('id')}`})
        }
        const instType = instance.getAttribute('type');
        // console.log('instance type', instance.type);

        let serialized;
        if (this.serialization === 'none') {
            serialized = undefined;
        } else {
            // const relevant = this.selectRelevant(instance.type);
            const relevant = Relevance.selectRelevant(this, instType);
            serialized = this._serialize(instType, relevant);
        }

        // let serialized = serializer.serializeToString(relevant);
        if (this.method.toLowerCase() === 'get') {
            serialized = undefined;
        }
        // console.log('data being send', serialized);
        // console.log('submitting data',serialized);

        // if (resolvedUrl === '#echo') {
        if (resolvedUrl.startsWith('#echo')) {
            const data = this._parse(serialized, instance);
            this._handleResponse(data);
            // this.dispatch('submit-done', {});
            Fore.dispatch(this, 'submit-done', {});
            this.parameters.clear();
            return;
        }

        if (resolvedUrl.startsWith('localStore:')) {

            if (this.method === 'get' || this.method === 'consume') {
                // let data = this._parse(serialized, instance);
                this.replace = 'instance';
                const key = resolvedUrl.substring(resolvedUrl.indexOf(':') + 1);
                const serialized = localStorage.getItem(key);
                if (!serialized) {
                    Fore.dispatch(this, 'submit-error', {message: `Error reading key ${key} from localstorage`});
                    this.parameters.clear();
                    return;
                }
                const data = this._parse(serialized, instance);
                this._handleResponse(data);
                if (this.method === 'consume') {
                    localStorage.removeItem(key);
                }
                Fore.dispatch(this, 'submit-done', {});
            }
            if (this.method === 'post') {
                // let data = this._parse(serialized, instance);
                const key = resolvedUrl.substring(resolvedUrl.indexOf(':') + 1);
                localStorage.setItem(key, serialized);
                this._handleResponse(instance.instanceData);
                Fore.dispatch(this, 'submit-done', {});
            }
            if (this.method === 'delete') {
                const key = resolvedUrl.substring(resolvedUrl.indexOf(':') + 1);
                localStorage.removeItem(key);
                const newInst = new DOMParser().parseFromString('<data></data>', 'application/xml');
                this._handleResponse(newInst);
                Fore.dispatch(this, 'submit-done', {});
            }

            return;
        }

        // ### setting headers
        const headers = this._getHeaders();

        if (!this.methods.includes(this.method.toLowerCase())) {
            // this.dispatch('error', { message: `Unknown method ${this.method}` });
            Fore.dispatch(this, 'error', {message: `Unknown method ${this.method}`});
            return;
        }
        try {
            const response = await fetch(resolvedUrl, {
                method: this.method,
                /*
                                mode: 'cors',
                                credentials: 'include',
                */
                headers,
                body: serialized,
            });

            if (!response.ok || response.status > 400) {
                // this.dispatch('submit-error', { message: `Error while submitting ${this.id}` });
                Fore.dispatch(this, 'submit-error', {message: `Error while submitting ${this.id}`});
                return;
            }

            const contentType = response.headers.get('content-type').toLowerCase();
            if (
                contentType.startsWith('text/plain') ||
                contentType.startsWith('text/html') ||
                contentType.startsWith('text/markdown')
            ) {
                const text = await response.text();
                this._handleResponse(text, resolvedUrl,contentType);
            } else if (contentType.startsWith('application/json')) {
                const json = await response.json();
                this._handleResponse(json, resolvedUrl,contentType);
            } else if (contentType.startsWith('application/xml')) {
                const text = await response.text();
                const xml = new DOMParser().parseFromString(text, 'application/xml');
                this._handleResponse(xml, resolvedUrl,contentType);
            } else {
                const blob = await response.blob();
                this._handleResponse(blob, resolvedUrl,contentType);
            }

            // this.dispatch('submit-done', {});
            Fore.dispatch(this, 'submit-done', {});
        } catch (error) {
            Fore.dispatch(this, 'submit-error', {error: error.message});
        } finally {
            this.parameters.clear();
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

    _serialize(instanceType, relevantNodes) {
        if (this.serialization === 'application/x-www-form-urlencoded') {
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
        if (instanceType === 'text') {
            return relevantNodes;
        }
        throw new Error('unknown instance type ', instanceType);
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
            const {name} = header;
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
    _handleResponse(data, resolvedUrl, contentType) {
        // console.log('_handleResponse ', data);

        /*
        // ### responses need to be handled depending on their type.
        if(this.type === 'json'){

        }
    */

        const targetInstance = this._getTargetInstance();

/*
        if(this.replace === 'merge'){
            if (targetInstance && targetInstance.type === 'xml') {
                targetInstance.partialInstance = data;

                const merged = this._mergeXML(targetInstance.instanceData,targetInstance.partialInstance);
                console.log('merged', merged);

                targetInstance.instanceData = merged;
                console.log('merging partial instance',targetInstance.partialInstance)
                /!*
                targetInstance.instanceData not touched here as we want to keep the default instance unmodified as the full template for the UI.
                *!/

                // Skip any refreshes if the model is not yet inited#
                // duplicate from replace='instance'
                // if (this.model.inited) {
                    this.model.updateModel(); // force update
                const owner = this.getOwnerForm();
                // owner.mergePartial = true;
                owner.refresh(true);
                // }
            }
        }
*/

        if (this.replace === 'instance') {
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
                    if (data.nodeType === Node.DOCUMENT_NODE) {
                        theTarget.appendChild(data.firstElementChild);
                    } else {
                        theTarget.innerHTML = data;
                    }
                } else {
                    const instanceData = data;
                    targetInstance.instanceData = instanceData;
                    // console.log('### replaced instance ', this.getModel().instances);
                    // console.log('### replaced instance ', targetInstance.instanceData);
                }

                // Skip any refreshes if the model is not yet inited
                if (this.model.inited) {
                    this.model.updateModel(); // force update
                    this.getOwnerForm().refresh(true);
                }
            } else {
                throw new Error(`target instance not found: ${targetInstance}`);
            }
        }

        if (this.replace === 'all') {
            const target = this._getProperty('target');
            if(target && target === '_blank'){
                const win = window.open("", "_blank");
                win.document.write(data);
                win.document.close();
            }else{
                document.open();
                document.write(data);
                document.close();
                window.location.href = resolvedUrl;
            }
            // document.getElementsByTagName('html')[0].innerHTML = data;
        }
        if (this.replace === 'target' && contentType.startsWith('text/html')) {
            // const target = this.getAttribute('target');
            const target = this._getProperty('target');
            const targetNode = document.querySelector(target);
            if(targetNode){
                targetNode.innerHTML = data;
            }else{
                Fore.dispatch(this, 'submit-error', {message:`targetNode for selector ${target} not found`});
            }
        }
        if (this.replace === 'redirect') {
            window.location.href = data;
        }
    }


/*
    _mergeXML(xml1, xml2) {
        const parser = new DOMParser();
        const serializer = new XMLSerializer();

        // const doc1 = parser.parseFromString(xml1, 'text/xml');
        // const doc2 = parser.parseFromString(xml2, 'text/xml');

        this.mergeNodes(xml1.documentElement, xml2.documentElement);

        // return serializer.serializeToString(xml1);
        return xml1;
    }
*/

/*
    _mergeNodes(node1, node2) {
        const childNodes1 = node1.childNodes;
        const childNodes2 = node2.childNodes;

        for (let i = 0; i < childNodes2.length; i++) {
            const child2 = childNodes2[i];
            let nodeMerged = false;

            if (child2.nodeType === 1) { // Element Node
                for (let j = 0; j < childNodes1.length; j++) {
                    const child1 = childNodes1[j];
                    if (child1.nodeType === 1 && child1.tagName === child2.tagName) {
                        this._mergeNodes(child1, child2);
                        nodeMerged = true;
                        break;
                    }
                }
            }

            if (!nodeMerged) {
                const clonedNode = child2.cloneNode(true);
                node1.appendChild(clonedNode);
            }
        }
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
        Fore.dispatch(this, 'submit-error', {});
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
