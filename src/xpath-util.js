import * as fx from 'fontoxpath';

export class XPathUtil {

	/**
	 * Alternative to `contains` that respects shadowroots
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
   */
  static getClosest(querySelector, start) {
    while (start && !start.matches || !start.matches(querySelector)) {
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
    if (start.parentNode &&
        (start.parentNode.nodeType !== Node.DOCUMENT_NODE || start.parentNode.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) ) {
/*
      if (start.parentNode.hasAttribute('ref')) {
        return start.parentNode;
      }
      return XPathUtil.getParentBindingElement(start.parentNode);
*/

      return start.parentNode.closest('[ref]');
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

	static resolveInstance(boundElement, path){
		let instanceId = XPathUtil.getInstanceId(path);
		if (!instanceId) {
			instanceId = XPathUtil.getInstanceId(boundElement.getAttribute('ref'));
		}
    if(instanceId !== null){
      return instanceId;
    }

    const parentBinding = XPathUtil.getParentBindingElement(boundElement);
    if(parentBinding){
      return this.resolveInstance(parentBinding);
    }
    return 'default';
  }

  static getPath(node, instanceId) {
    const path = fx.evaluateXPathToString('path()', node);
	// Path is like `$default/x/y`
	return `$${instanceId}${XPathUtil.shortenPath(path)}`;
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
