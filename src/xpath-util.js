import * as fx from 'fontoxpath';

/**
 * Checks wether the specified path expression is an absolute path.
 *
 * @param path the path expression.
 * @return <code>true</code> if specified path expression is an absolute
 * path, otherwise <code>false</code>.
 */

export class XPathUtil {
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
      XPathUtil.getParentBindingElement(start.parentNode);
    }
    return null;
  }

  static isAbsolutePath(path) {
    return path != null && (path.startsWith('/') || path.startsWith('instance('));
  }

  static isRepeated(element) {
    return element.parentElement.closest('fx-repeatitem');
  }

  static isSelfReference(ref) {
    return ref === '.' || ref === './text()' || ref === 'text()' || ref === '' || ref === null;
  }

  static getDefaultInstance(boundElement) {
    // const fore = boundElement.closest('fx-fore');
    const fore = XPathUtil.getForeElement(boundElement);
    const defaultInstance = fore.querySelector('fx-instance');
    if (!defaultInstance) {
      throw new Error('no default instance present');
    }
    return defaultInstance;
  }

  static getForeElement(start) {
    if (start.nodeName === 'FX-FORE') {
      return start;
    }
    if (start.parentNode) {
      return XPathUtil.getForeElement(start.parentNode);
    }
    throw new Error('no Fore element present');
  }

  // todo: this will need more work to look upward for instance() expr.
  static getInstanceId(ref) {
    if (!ref) {
      return 'default';
    }
    if (ref.startsWith('instance(')) {
      const result = ref.substring(ref.indexOf('(') + 1);
      return result.substring(1, result.indexOf(')') - 1);
    }
    return 'default';
  }

  // todo: certainly not ideal to rely on duplicating instance id on instance document - better way later ;)
  static getPath(node) {
    const path = fx.evaluateXPath('path()', node);
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
