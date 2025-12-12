import * as fx from 'fontoxpath';
import { createNamespaceResolver } from './xpath-evaluation';

export class XPathUtil {
  /**
   * Recursively check AST for any dynamic expression components.
   */
  static containsDynamicContent(astNode) {
    if (!astNode) return false;

    // Location paths, function calls, or variable refs are dynamic
    if (
      astNode.type === 'pathExpression' ||
      astNode.type === 'functionCall' ||
      astNode.type === 'variableReference'
    ) {
      return true;
    }

    // Recursively check any child expressions
    for (const key in astNode) {
      if (astNode[key] && typeof astNode[key] === 'object') {
        if (Array.isArray(astNode[key])) {
          for (const item of astNode[key]) {
            if (XPathUtil.containsDynamicContent(item)) return true;
          }
        } else if (XPathUtil.containsDynamicContent(astNode[key])) return true;
      }
    }

    return false;
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
   * @param doc {XMLDocument}
   * @param fore
   * @return {Node|Attr}
   */
  static createNodesFromXPath(xpath, doc, fore) {
    const resolveNamespace = createNamespaceResolver(xpath, fore);

    if (!doc) {
      doc = document.implementation.createDocument(null, null, null); // Create a new XML document if not provided
    }

    const parts = [];
    let scratch = '';
    let isInPredicate = false;
    for (const char of xpath.split('')) {
      if (!isInPredicate) {
        // We are not in a predicate, the slash will terminate our step.
        if (char === '/') {
          parts.push(scratch);
          scratch = '';
          continue;
        }

        scratch += char;
        if (char === '[') {
          isInPredicate = true;
        }
        continue;
      }
      // We are in a predicate! So the only interesting token is ']', which means we're out of one.
      scratch += char;

      if (char === ']') {
        isInPredicate = false;
      }
    }
    // Flush the last step
    parts.push(scratch);

    let rootNode = null;
    let currentNode = null;

    for (const part of parts) {
      if (!part) continue; // Skip empty parts (e.g., leading slashes)
      if (part === '.') {
        // A '.' does not introduce new elements
        continue;
      }

      // Handle attributes
      if (part.startsWith('@')) {
        const attrName = part.slice(1); // Strip '@'
        if (!currentNode) {
          return doc.createAttribute(attrName, '');
        }
        currentNode.setAttribute(attrName, '');
      } else {
        // We are a predicate selector! Handle it
        // This regex matches strings like:
        // - listBibl
        // - tei:listBibl
        // - listBibl[@type="foo"]
        // - listBibl[@type="foo"][@class="bar"]
        // It will also match strings like
        // - listBibl[ancestor-or-self::foo]
        // which will be filtered out later.

        const result = part.match(/^(?<name>[\w:-]+)(?<predicates>(\[[^]*\])*)$/);
        if (!result) {
          throw new Error(
            `No element could be made from the XPath step ${part}. It must be of these forms: 'localName', 'prefix:name', 'name[@attr="value"]' et cetera.`,
          );
        }
        const { name, predicates } = result.groups;
        // Handle namespaces if present
        const [prefix, localName] = name.includes(':') ? name.split(':') : [null, name];
        const namespace = resolveNamespace(prefix);

        const newElement = namespace
          ? doc.createElementNS(namespace, localName)
          : doc.createElement(localName);

        if (predicates) {
          const predicateExtractionRegex =
            /(\[@(?<name>[\w:-]*)\s?=\s?["'](?<value>[^"']*)['"]\])+/g;
          const parsedPredicates = predicates
            .matchAll(predicateExtractionRegex)
            .map(match => ({ attrName: match.groups.name, value: match.groups.value }));
          for (const { attrName, value } of parsedPredicates) {
            newElement.setAttribute(attrName, value);
          }
        }
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
    // JSON lens case
    if (start && start.__jsonlens__ === true) {
      let current = start.parent;
      while (current) {
        if (current.bindingElement) return current.bindingElement;
        current = current.parent;
      }
      return null;
    }

    // DOM case
    let node = start?.parentNode;

    while (
      node &&
      node.nodeType !== Node.DOCUMENT_NODE &&
      node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
    ) {
      if (node.matches?.('[ref],fx-repeatitem')) {
        return node;
      }
      node = node.parentNode;
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
      path != null && (path.startsWith('/') || path.startsWith('instance(') || path.startsWith('$'))
    );
  }

  /**
   * @param {string} ref
   */
  static isSelfReference(ref) {
    return ref === '.' || ref === './text()' || ref === 'text()' || ref === '' || ref === null;
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
  static getInstanceId(ref, boundElement) {
    const refStr = typeof ref === 'string' ? ref.trim() : '';

    // Explicit "default instance" selector
    if (refStr.startsWith('instance()')) {
      return 'default';
    }

    // Explicit instance('id') selector at the START of the expression only
    // (Do NOT use refStr.includes('instance(') because predicates may reference other instances.)
    {
      const m = refStr.match(/^instance\(\s*(['"])(?<id>.*?)\1\s*\)/);
      if (m?.groups?.id != null) {
        return m.groups.id;
      }
    }

    // Variable indirection (may ultimately point to instance(...))
    if (refStr.startsWith('$')) {
      const variableName = refStr.match(/^\$(?<variableName>[a-zA-Z0-9\-_]+)/)?.groups
        ?.variableName;

      let closestActualFormElement = boundElement;
      while (closestActualFormElement && !('inScopeVariables' in closestActualFormElement)) {
        closestActualFormElement =
          closestActualFormElement.nodeType === Node.ATTRIBUTE_NODE
            ? closestActualFormElement.ownerElement
            : closestActualFormElement.parentNode;
      }

      const correspondingVariable = closestActualFormElement?.inScopeVariables?.get(variableName);
      if (!correspondingVariable) return null;

      return this.getInstanceId(correspondingVariable.valueQuery, correspondingVariable);
    }

    // If we can't decide from the ref itself (relative paths, '/', '.', missing ref, fx-repeatitem),
    // inherit from the nearest ancestor that *does* have a ref or explicit instance().
    const parentBinding = XPathUtil.getParentBindingElement(boundElement);
    if (parentBinding) {
      // If this is a repeatitem boundary with no ref, keep climbing
      if (parentBinding.matches?.('fx-repeatitem') && !parentBinding.getAttribute?.('ref')) {
        return this.getInstanceId(null, parentBinding);
      }

      const parentRef = parentBinding.getAttribute?.('ref');
      if (parentRef) {
        return this.getInstanceId(parentRef, parentBinding);
      }

      // Parent binding exists but has no ref (rare, but safe): keep climbing
      return this.getInstanceId(null, parentBinding);
    }

    // No parent binding => top of scope. If ref wasn't explicit, default.
    return 'default';
  }

  /**
   * @param {HTMLElement} boundElement
   * @param {string} path
   * @returns {string}
   */
  static resolveInstance(boundElement, path) {
    let instanceId = XPathUtil.getInstanceId(path, boundElement);
    if (!instanceId) {
      instanceId = XPathUtil.getInstanceId(boundElement.getAttribute('ref'), boundElement);
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
  /*
  static getDocPath(node) {
    const path = fx.evaluateXPathToString('path()', node);
    // Path is like `$default/x[1]/y[1]`
    const shortened = XPathUtil.shortenPath(path);
    return shortened.startsWith('/') ? `${shortened}` : `/${shortened}`;
  }
*/

  /**
   * @param {string} path
   * @returns string
   */
  static shortenPath(path) {
    const tmp = path.replaceAll(/(Q{(.*?)\})/g, '');
    if (tmp === 'root()') return tmp;
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
