import * as fx from 'fontoxpath';

export class XPathUtil {

  /**
   * Alternative to `closest` that respects subcontrol boundaries
   */
  static getClosest(querySelector, start) {
    while (!start.matches(querySelector)) {
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
   * @param start where to start the search
   * @returns {*|null}
   */
  static getParentBindingElement(start) {
    /*    if (start.parentNode.host) {
      const { host } = start.parentNode;
      if (host.hasAttribute('ref')) {
        return host;
      }
    } else */
    if (start.parentNode && start.parentNode.nodeType !== Node.DOCUMENT_NODE) {
      if (start.parentNode.hasAttribute('ref')) {
        return start.parentNode;
      }
      return XPathUtil.getParentBindingElement(start.parentNode);
    }
    return null;
  }

  /**
   * Checks whether the specified path expression is an absolute path.
   *
   * @param path the path expression.
   * @return <code>true</code> if specified path expression is an absolute
   * path, otherwise <code>false</code>.
   */
  static isAbsolutePath(path) {
    return path != null && (path.startsWith('/') || path.startsWith('instance('));
  }

  static isSelfReference(ref) {
    return ref === '.' || ref === './text()' || ref === 'text()' || ref === '' || ref === null;
  }

  /**
   * returns the instance id from a complete XPath using `instance()` function.
   *
   * Will return 'default' in case no ref is given at all or the `instance()` function is called without arg.
   *
   * Otherwise instance id is extracted from function and returned. If all fails null is returned.
   * @param ref
   * @returns {string}
   */
  static getInstanceId(ref) {
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
    return null;
  }

  static resolveInstance(boundElement){
    const instanceId = XPathUtil.getInstanceId(boundElement.getAttribute('ref'));
    if(instanceId !== null){
      return instanceId;
    }

    const parentBinding = XPathUtil.getParentBindingElement(boundElement);
    if(parentBinding){
      return this.resolveInstance(parentBinding);
    }
    return 'default';
  }

  // todo: certainly not ideal to rely on duplicating instance id on instance document - better way later ;)
  static getPath(node) {
    const path = fx.evaluateXPathToString('path()', node);
    /*
    const instanceId = node.ownerDocument.firstElementChild.getAttribute('id');
    if (instanceId !== null && instanceId !== 'default') {
      return `#${instanceId}${XPathUtil.shortenPath(path)}`;
    }
*/
    return XPathUtil.shortenPath(path);
  }

  static shortenPath(path) {
    const tmp = path.replaceAll(/(Q{(.*?)\})/g, '');
    // cut off leading slash
    const tmp1 = tmp.substring(1, tmp.length);
    // ### cut-off root node ref
    return tmp1.substring(tmp1.indexOf('/'), tmp.length);
  }

  static getBasePath(dep) {
    const split = dep.split(':');
    return split[0];
  }
}
