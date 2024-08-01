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
            (start.parentNode.nodeType !== Node.DOCUMENT_NODE || start.parentNode.nodeType !== Node.DOCUMENT_FRAGMENT_NODE)) {
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
        return path != null && (path.startsWith('/') || path.startsWith('$'));
    }

    static isSelfReference(ref) {
        return ref === '.' || ref === './text()' || ref === 'text()' || ref === '' || ref === null;
    }

    /**
     * returns the pure data id from a data variable.
     *
     * @param ref
     * @returns {string} input string without leading '$'
     */
    static getDataId(ref) {
        if (!ref) {
            return 'default';
        }
        return ref.substring(1,ref.length);
    }

    static resolveData(boundElement, path) {
        let dataId = XPathUtil.getDataId(path);
        if (!dataId) {
            dataId = XPathUtil.getDataId(boundElement.getAttribute('ref'));
        }
        if (dataId !== null) {
            return dataId;
        }

        const parentBinding = XPathUtil.getParentBindingElement(boundElement);
        if (parentBinding) {
            return this.resolveData(parentBinding, path);
        }
        return 'default';
    }

    static getDocPath(node) {
        const path = fx.evaluateXPathToString('path()', node);
        // Path is like `$default/x[1]/y[1]`
        const shortened = XPathUtil.shortenPath(path);
        return shortened.startsWith('/') ? `${shortened}` : `/${shortened}`;
    }

    static getPath(node, dataId) {
        const path = fx.evaluateXPathToString('path()', node);
        // Path is like `$default/x[1]/y[1]`
        const shortened = XPathUtil.shortenPath(path);
        return shortened.startsWith('/') ? `$${dataId}${shortened}` : `$${dataId}/${shortened}`;
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
