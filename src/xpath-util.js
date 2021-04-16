import * as fx from 'fontoxpath';

/**
 * Checks wether the specified path expression is an absolute path.
 *
 * @param path the path expression.
 * @return <code>true</code> if specified path expression is an absolute
 * path, otherwise <code>false</code>.
 */

export class XPathUtil {
  static isAbsolutePath(path) {
    return path != null && (path.startsWith('/') || path.startsWith('instance('));
  }

  static isSelfReference(ref) {
    return ref === '.' || ref === './text()' || ref === 'text()' || ref === '' || ref === null;
  }

  // todo: this will need more work to look upward for instance() expr.
  static getInstanceId(ref) {
    if (ref.startsWith('instance(')) {
      const result = ref.substring(ref.indexOf('(') + 1);
      return result.substring(1, result.indexOf(')') - 1);
    }
    return 'default';
  }

  // todo: certainly not ideal to rely on duplicating instance id on instance document - better way later ;)
  static getPath(node) {
    const path = fx.evaluateXPath('path()', node);
    const instanceId = node.ownerDocument.firstElementChild.getAttribute('id');
    if (instanceId !== null && instanceId !== 'default') {
      return `#${instanceId}${XPathUtil.shortenPath(path)}`;
    }
    return XPathUtil.shortenPath(path);
  }

  static shortenPath(path) {
    const steps = path.split('/');
    let result = '';
    for (let i = 2; i < steps.length; i += 1) {
      const step = steps[i];
      if (step.indexOf('{}') !== -1) {
        const q = step.split('{}');
        result += `/${q[1]}`;
      } else {
        result += `/${step}`;
      }
    }
    return result;
  }
}
