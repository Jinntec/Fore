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
    return children.length ? children[0] : null;
  }

  getLastChild(node) {
    const children = node.getChildren();
    return children.length ? children[children.length - 1] : null;
  }

  getNextSibling(node) {
    const parent = node.getParent();
    if (!parent) return null;
    const siblings = parent.getChildren();
    const idx = siblings.indexOf(node);
    return siblings[idx + 1] || null;
  }

  getPreviousSibling(node) {
    const parent = node.getParent();
    if (!parent) return null;
    const siblings = parent.getChildren();
    const idx = siblings.indexOf(node);
    return idx > 0 ? siblings[idx - 1] : null;
  }

  getNodeName(node) {
    return String(node.getKey());
  }

  getNodeValue(node) {
    return node.getValue();
  }

  /**
   * CRITICAL for fontoxpath: atomization / string-value.
   * If this returns '' for JSON nodes, contains(), string(), lower-case(), etc. will behave as if empty.
   */
  getData(node) {
    const v = node.getValue();
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);

    // object/array: pragmatic string-value
    try {
      return JSON.stringify(v);
    } catch (_e) {
      return String(v);
    }
  }

  getAllAttributes() {
    return [];
  }

  getAttribute() {
    return null;
  }
}