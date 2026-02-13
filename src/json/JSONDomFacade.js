// src/json/JSONDomFacade.js
export class JSONDomFacade {
  // Treat JSONNodes as "element-like" nodes for XPath purposes.
  // FontoXPath uses DOM nodeType numbers internally; 1 corresponds to ELEMENT_NODE.
  getNodeType(/* node */) {
    return 1;
  }

  getParentNode(node) {
    return node.getParent();
  }

  getChildNodes(node) {
    return node.getChildren();
  }

  getChildren(node) {
    return node.getChildren();
  }

  getChildNodeCount(node) {
    return node.getChildren().length;
  }

  getFirstChild(node) {
    const children = node.getChildren();
    return children.length > 0 ? children[0] : null;
  }

  getLastChild(node) {
    const children = node.getChildren();
    return children.length > 0 ? children[children.length - 1] : null;
  }

  getNextSibling(node) {
    const parent = node.getParent();
    if (!parent) return null;
    const siblings = parent.getChildren();
    const index = siblings.indexOf(node);
    return siblings[index + 1] || null;
  }

  getPreviousSibling(node) {
    const parent = node.getParent();
    if (!parent) return null;
    const siblings = parent.getChildren();
    const index = siblings.indexOf(node);
    return index > 0 ? siblings[index - 1] : null;
  }

  getNodeName(node) {
    return String(node.getKey());
  }

  /**
   * Used by FontoXPath for atomization / string value.
   * We want search expressions like contains(.) to work for object nodes.
   */
  getNodeValue(node) {
    return this.getData(node);
  }

  /**
   * Treat this as the node's "string-value".
   * - primitives => string form
   * - objects/arrays => JSON string (so contains(.) works as “deep contains”)
   */
  getData(node) {
    const v = node.getValue();

    if (v === null || v === undefined) return '';

    const t = typeof v;
    if (t === 'string') return v;
    if (t === 'number' || t === 'boolean' || t === 'bigint') return String(v);

    try {
      return JSON.stringify(v);
    } catch (_e) {
      return '';
    }
  }

  getAllAttributes(/* node */) {
    return [];
  }

  getAttribute(/* node, name */) {
    return null;
  }

  getNamespaceURI(/* node */) {
    return null;
  }

  getLocalName(node) {
    return this.getNodeName(node);
  }

  getPrefix(/* node */) {
    return '';
  }
}
