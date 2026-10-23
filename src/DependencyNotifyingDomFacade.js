import { getBucketsForNode } from 'fontoxpath';

/**
 * A DomFacade that will intercept any and all accesses to _nodes_ from an XPath. Basically the same
 * as the `depends` function, but less explicit and will automatically be called for any node that
 * will be touched in the XPath.
 *
 * By default it reads from the live DOM. When an `inner` facade is provided (e.g. the
 * JSONDomFacade), all accessors delegate to it instead, still notifying `onNodeTouched` —
 * this lets non-DOM data models participate in dependency tracking.
 *
 * Maybe some more granularity is better. Maybe only notify a node's attributes are touched?
 *
 */
export class DependencyNotifyingDomFacade {
  /**
   * @param  onNodeTouched - onNodeTouched A function what will be executed whenever a node is 'touched' by the XPath
   * @param  inner - optional facade to delegate all accessors to (e.g. JSONDomFacade)
   * @param  {{touchOrigin?: boolean}} [options] `touchOrigin`: also report the node a step starts from, not just what it
   * returns. A first child, a sibling, the list of children or an attribute that is not there yet depend on the node
   * they are read from; without it, adding one is not noticed by a read that returned something else (or nothing).
   * Off by default: ref bindings resolve a ModelItem for every touched node, so this creates ModelItems for the
   * parents of everything they read. Meant for consumers that only compare nodes (template expressions).
   */
  constructor(onNodeTouched, inner = null, options = {}) {
    this._onNodeTouched = onNodeTouched;
    this._inner = inner;
    this._touchOrigin = !!options.touchOrigin;
  }

  /**
   * Returns a facade sharing the same onNodeTouched callback but delegating to `inner`.
   * Used by xpath-evaluation.js to route JSON contexts through the JSONDomFacade
   * without callers having to know the context type.
   *
   * @param  inner - the facade to delegate to
   */
  withInner(inner) {
    return new DependencyNotifyingDomFacade(this._onNodeTouched, inner, {
      touchOrigin: this._touchOrigin,
    });
  }

  /**
   * Node identity/shape reads (used by the JSONDomFacade surface). Not treated as
   * data dependencies — no notification.
   */
  getNodeType(node) {
    if (this._inner) return this._inner.getNodeType(node);
    return node.nodeType;
  }

  getNodeName(node) {
    if (this._inner) return this._inner.getNodeName(node);
    return node.nodeName;
  }

  getNodeValue(node) {
    this._onNodeTouched(node);
    if (this._inner) return this._inner.getNodeValue(node);
    return node.nodeValue;
  }

  getChildren(node) {
    if (this._inner) {
      const children = this._inner.getChildren(node);
      children.forEach(child => this._onNodeTouched(child));
      return children;
    }
    return this.getChildNodes(node);
  }

  getChildNodeCount(node) {
    if (this._inner) return this._inner.getChildNodeCount(node);
    return node.childNodes.length;
  }

  /**
   * Get all attributes of this element.
   * The bucket can be used to narrow down which attributes should be retrieved.
   *
   * @param  node -
   */
  getAllAttributes(node) {
    this._onNodeTouched(node); // <== Important!
    if (this._inner) return this._inner.getAllAttributes(node);
    return Array.from(node.attributes);
  }

  /**
   * Get the value of specified attribute of this element.
   *
   * @param  node -
   * @param  attributeName -
   */
  getAttribute(node, attributeName) {
    if (this._inner) {
      this._onNodeTouched(node);
      return this._inner.getAttribute(node, attributeName);
    }
    const attr = node.getAttributeNode(attributeName);
    // without the attribute, depend on the element: the attribute may be added
    if (attr || this._touchOrigin) this._onNodeTouched(attr ?? node);
    return attr?.value ?? null;
  }

  /**
   * Get all child nodes of this element.
   * The bucket can be used to narrow down which child nodes should be retrieved.
   *
   * @param  node -
   * @param  bucket - The bucket that matches the attribute that will be used.
   */
  getChildNodes(node, bucket) {
    if (this._inner) {
      const children = this._inner.getChildNodes(node, bucket);
      children.forEach(child => this._onNodeTouched(child));
      return children;
    }
    // the list of children changes when one is added, moved or removed
    if (this._touchOrigin) this._onNodeTouched(node);
    const matchingNodes = Array.from(node.childNodes).filter(
      childNode => !bucket || getBucketsForNode(childNode).includes(bucket),
    );
    matchingNodes.forEach(matchingNode => this._onNodeTouched(matchingNode));
    return matchingNodes;
  }

  /**
   * Get the data of this node.
   *
   * @param  node -
   */
  getData(node) {
    if (this._inner) {
      this._onNodeTouched(node);
      return this._inner.getData(node);
    }
    if (node.nodeType === Node.ATTRIBUTE_NODE) {
      this._onNodeTouched(node);
      return node.value;
    }
    // Text node (a detached one has no parent to depend on)
    if (node.parentNode) this._onNodeTouched(node.parentNode);
    return node.data;
  }

  /**
   * Get the first child of this element.
   * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
   *
   * @param  node -
   * @param  bucket - The bucket that matches the attribute that will be used.
   */
  getFirstChild(node, bucket) {
    if (this._inner) {
      const child = this._inner.getFirstChild(node, bucket);
      if (child) this._onNodeTouched(child);
      return child;
    }
    if (this._touchOrigin) this._onNodeTouched(node);
    for (const child of node.childNodes) {
      if (!bucket || getBucketsForNode(child).includes(bucket)) {
        this._onNodeTouched(child);
        return child;
      }
    }
    return null;
  }

  /**
   * Get the last child of this element.
   * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
   *
   * @param  node -
   * @param  bucket - The bucket that matches the attribute that will be used.
   */
  getLastChild(node, bucket) {
    if (this._inner) {
      const child = this._inner.getLastChild(node, bucket);
      if (child) this._onNodeTouched(child);
      return child;
    }
    if (this._touchOrigin) this._onNodeTouched(node);
    const children = Array.from(node.childNodes).filter(
      child => !bucket || getBucketsForNode(child).includes(bucket),
    );
    const last = children[children.length - 1];
    if (last) this._onNodeTouched(last);
    return last || null;
  }

  /**
   * Get the next sibling of this node
   * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
   *
   * @param  node -
   * @param  bucket - The bucket that matches the nextSibling that is requested.
   */
  getNextSibling(node, bucket) {
    if (this._inner) {
      const sibling = this._inner.getNextSibling(node, bucket);
      if (sibling) this._onNodeTouched(sibling);
      return sibling;
    }
    // siblings are the children of the parent
    if (this._touchOrigin && node.parentNode) this._onNodeTouched(node.parentNode);
    for (let sibling = node.nextSibling; sibling; sibling = sibling.nextSibling) {
      if (bucket && !getBucketsForNode(sibling).includes(bucket)) {
        // eslint-disable-next-line no-continue
        continue;
      }
      this._onNodeTouched(sibling);
      return sibling;
    }
    return null;
  }

  /**
   * Get the parent of this element.
   * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
   *
   * @param  node - the starting node
   */
  getParentNode(node) {
    // Deliberately not notifying: navigating up must not register a dependency on the parent.
    if (this._inner) return this._inner.getParentNode(node);
    // an attribute has no parentNode: its parent is the element it belongs to
    return node.nodeType === Node.ATTRIBUTE_NODE ? node.ownerElement : node.parentNode;
  }

  /**
   * Get the previous sibling of this element.
   * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
   *
   * @param  node -
   * @param  bucket - The bucket that matches the attribute that will be used.
   */
  getPreviousSibling(node, bucket) {
    if (this._inner) {
      const sibling = this._inner.getPreviousSibling(node, bucket);
      if (sibling) this._onNodeTouched(sibling);
      return sibling;
    }
    if (this._touchOrigin && node.parentNode) this._onNodeTouched(node.parentNode);
    for (let sibling = node.previousSibling; sibling; sibling = sibling.previousSibling) {
      // eslint-disable-next-line no-continue
      if (bucket && !getBucketsForNode(sibling).includes(bucket)) continue;
      this._onNodeTouched(sibling);
      return sibling;
    }
    return null;
  }
}
