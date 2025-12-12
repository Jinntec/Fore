export class JSONDomFacade {
  getParentNode(node) {
    return node.getParent();
  }

  getChildNodes(node) {
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

  getNodeValue(node) {
    return node.getValue();
  }

  getAllAttributes(/* node */) {
    return [];
  }

  getAttribute(/* node, name */) {
    return null;
  }
}
