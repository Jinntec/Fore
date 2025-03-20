import * as fx from 'fontoxpath';

export class XPathUtil {
    /**
     * @param {Node|Node[]|unknown} node - The thing to calculate the path over
     */
    static getCanonicalXPath(node) {
        const instanceId = 'default';
        node = Array.isArray(node) ? node[0] : node;

        if (!node || !node.nodeType) {
            // We have a non-node. There is no path available. This can happen
            // in fx-output or template expressions.
            return 'non-node-item';
        }

        const path = fx.evaluateXPathToString('path()', node);

        if (
            node?.parentNode &&
            node.parentNode.nodeType === Node.DOCUMENT_NODE
        ) {
            return `$${instanceId}`;
        }
        const shortened = XPathUtil.shortenPath(path);
        const out = shortened.startsWith('/')
            ? `$${instanceId}${shortened}`
            : `$${instanceId}/${shortened}`;
        // console.log('XPathUtil.getPath',out);
        return out;

        return path;
    }

    /**
     * creates DOM Nodes from an XPath locationpath expression. Support namespaced and un-namespaced
     * nodes.
     * E.g. 'foo/bar' creates an element 'foo' with an child element 'bar'
     * 'foo/@bar' creates a 'foo' element with an 'bar' attribute
     *
     * supports multiple steps
     *
     * @param xpath
     * @param doc
     * @param fore
     * @return {*}
     */
    static createNodesFromXPath(xpath, doc, fore) {
        if (!doc) {
            doc = document.implementation.createDocument(null, null, null); // Create a new XML document if not provided
        }

        const parts = xpath.split('/');
        let rootNode = null;
        let currentNode = null;

        for (const part of parts) {
            if (!part) continue; // Skip empty parts (e.g., leading slashes)

            // Handle attributes
            if (part.startsWith('@')) {
                const attrName = part.slice(1); // Strip '@'
                if (!currentNode) {
                    throw new Error(
                        'Cannot create an attribute without a parent element.',
                    );
                }
                currentNode.setAttribute(attrName, '');
            } else {
                // Handle namespaces if present
                const [prefix, localName] = part.includes(':')
                    ? part.split(':')
                    : [null, part];
                const namespace = prefix
                    ? XPathUtil.lookupNamespace(fore, prefix)
                    : null;

                const newElement = namespace
                    ? doc.createElementNS(namespace, part)
                    : doc.createElement(localName);

                if (!rootNode) {
                    rootNode = newElement; // Set as the root node
                } else {
                    currentNode.appendChild(newElement);
                }
                currentNode = newElement;
            }
        }

        if (!rootNode) {
            throw new Error('Invalid XPath; no root element could be created.');
        }

        return rootNode;
    }

    /**
     * looks up namespace on ownerForm. Though not strictly in the sense of resolving namespaces in XML, the
     * fx-fore element is a convenient place to put namespace declarations for 2 reasons:
     * - this way namespaces are scoped to a Fore element
     * - as fx-fore is a web component we can add our xmlns attributes as we got no restrictions to attributes
     *   though strictly speaking they are no xmlns declarations and just serve the purpose of namespace lookup.
     *
     * @param boundElement
     * @param prefix
     * @return {string}
     */
    static lookupNamespace(ownerForm, prefix) {
        return ownerForm.getAttribute(`xmlns:${prefix}`);
    }

    static querySelectorAll(querySelector, start) {
        const queue = [start];
        const found = [];
        while (queue.length) {
            const item = queue.shift();
            for (const child of Array.from(item.children).reverse()) {
                queue.unshift(child);
            }

            if (item.matches && item.matches('template')) {
                queue.unshift(item.content);
            }

            if (item.matches && item.matches(querySelector)) {
                found.push(item);
            }
        }

        return found;
    }

    /**
     * Alternative to `contains` that respects shadowroots
     * @param {Node} ancestor
     * @param {Node} descendant
     * @returns {boolean}
     */
    static contains(ancestor, descendant) {
        while (descendant) {
            if (descendant === ancestor) {
                return true;
            }

            if (descendant.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                // We are passing a shadow root boundary
                descendant = descendant.host;
            } else {
                descendant = descendant.parentNode;
            }
        }
        return false;
    }

    /**
     * Alternative to `closest` that respects subcontrol boundaries
     *
     * @param {string} querySelector
     * @param {Node} start
     * @returns {HTMLElement}
     */
    static getClosest(querySelector, start) {
        while ((start && !start.matches) || !start.matches(querySelector)) {
            if (start.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                // We are passing a shadow root boundary
                start = start.host;
                continue;
            }
            if (start.nodeType === Node.ATTRIBUTE_NODE) {
                // We are passing an attribute
                start = start.ownerElement;
                continue;
            }
            if (start.nodeType === Node.TEXT_NODE) {
                start = start.parentNode;
            }
            if (start.matches('fx-fore')) {
                // Subform reached. Bail out
                return null;
            }
            start = start.parentNode;
            if (!start) {
                return null;
            }
        }
        return start;
    }

    /**
     * returns next bound element upwards in tree
     * @param {Node} start where to start the search
     * @returns {*|null}
     */
    static getParentBindingElement(start) {
        /*    if (start.parentNode.host) {
          const { host } = start.parentNode;
          if (host.hasAttribute('ref')) {
            return host;
          }
        } else */
        if (
            start.parentNode &&
            (start.parentNode.nodeType !== Node.DOCUMENT_NODE ||
                start.parentNode.nodeType !== Node.DOCUMENT_FRAGMENT_NODE)
        ) {
            return this.getClosest('[ref],fx-repeatitem', start.parentNode);
        }
        return null;
    }

    /**
     * Checks whether the specified path expression is an absolute path.
     *
     * @param {string} path the path expression.
     * @returns {boolean} <code>true</code> if specified path expression is an absolute
     * path, otherwise <code>false</code>.
     */
    static isAbsolutePath(path) {
        return (
            path != null &&
            (path.startsWith('/') ||
                path.startsWith('instance(') ||
                path.startsWith('$'))
        );
    }

    /**
     * @param {string} ref
     */
    static isSelfReference(ref) {
        return (
            ref === '.' ||
            ref === './text()' ||
            ref === 'text()' ||
            ref === '' ||
            ref === null
        );
    }

    /**
     * returns the instance id from a complete XPath using `instance()` function.
     *
     * Will return 'default' in case no ref is given at all or the `instance()` function is called without arg.
     *
     * Otherwise instance id is extracted from function and returned. If all fails null is returned.
     * @param {string} ref
     * @param {HTMLElement}  boundElement  The element related to this ref. Used to resolve variables
     * @returns {string}
     */
    static getInstanceId(xpath, boundElement) {
        const ref = xpath.startsWith('{')
            ? xpath.substring(1, xpath.length - 1)
            : xpath;
        if (!ref) {
            return 'default';
        }
        if (ref.startsWith('instance()')) {
            return 'default';
        }
        if (ref.startsWith('instance(')) {
            const result = ref.substring(ref.indexOf('(') + 1);
            return result.substring(1, result.indexOf(')') - 1);
        }
        if (ref.startsWith('$')) {
            // this variable might actually point to an instance
            const variableName = ref.match(
                /\$(?<variableName>[a-zA-Z0-9\-\_]+).*/,
            )?.groups?.variableName;
            let closestActualFormElement = boundElement;
            while (
                closestActualFormElement &&
                !('inScopeVariables' in closestActualFormElement)
            ) {
                closestActualFormElement =
                    closestActualFormElement.nodeType === Node.ATTRIBUTE_NODE
                        ? closestActualFormElement.ownerElement
                        : closestActualFormElement.parentNode;
            }

            const correspondingVariable =
                closestActualFormElement?.inScopeVariables?.get(variableName);
            if (!correspondingVariable) {
                return null;
            }
            return this.getInstanceId(
                correspondingVariable.valueQuery,
                correspondingVariable,
            );
        }
        return 'default';
    }

    /**
     * @param {HTMLElement} boundElement
     * @param {string} path
     * @returns {string}
     */
    static resolveInstance(boundElement, path) {
        if (path.startsWith('$default')) return 'default';
        let instanceId = XPathUtil.getInstanceId(path, boundElement);
        if (!instanceId) {
            instanceId = XPathUtil.getInstanceId(
                boundElement.getAttribute('ref'),
                boundElement,
            );
        }
        if (instanceId !== null) {
            return instanceId;
        }

        const parentBinding = XPathUtil.getParentBindingElement(boundElement);
        if (parentBinding) {
            return this.resolveInstance(parentBinding, path);
        }
        return 'default';
    }

    /**
     * @param {Node} node
     * @returns string
     */
    static getDocPath(node) {
        const path = fx.evaluateXPathToString('path()', node);
        // Path is like `$default/x[1]/y[1]`
        const shortened = XPathUtil.shortenPath(path);
        return shortened.startsWith('/') ? `${shortened}` : `/${shortened}`;
    }

    /**
     * @param {Node} node
     * @param {string} instanceId
     * @returns string
     */
    static getPath(node, instanceId) {
        let path;
        if (Array.isArray(node) && node.length !== 0) {
            path = fx.evaluateXPathToString('path()', node[0]);
            // cut positional attr
            if(path.includes('[')){
                path = path.substring(0, path.length - 3);
            }
        } else {
            // const path = fx.evaluateXPathToString('path()', node);
            path = fx.evaluateXPathToString('path()', node);
        }
        if(path.endsWith('root()')){
            path = '';
        }
        // Path is like `$default/x[1]/y[1]`
        const shortened = XPathUtil.shortenPath(path);
        const out = shortened.startsWith('/')
            ? `$${instanceId}${shortened}`
            : `$${instanceId}/${shortened}`;
        // console.log('XPathUtil.getPath',out);
        return out;
    }

    /**
     * @param {string} path
     * @returns string
     */
    static shortenPath(path) {
        const tmp = path.replaceAll(/(Q{(.*?)\})/g, '');
        // cut off leading slash
        const tmp1 = tmp.substring(1, tmp.length);
        // ### cut-off root node ref
        return tmp1.substring(tmp1.indexOf('/'), tmp.length);
    }

    /**
     * @param {string} dep
     * @returns {string}
     */
    static getBasePath(dep) {
        const split = dep.split(':');
        return split[0];
    }
}
