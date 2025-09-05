import * as fx from 'fontoxpath';
import { evaluateXPathToString } from './xpath-evaluation.js';

/**
 * @param {string} path
 * @returns string
 */
function shortenPath(path) {
  const tmp = path.replaceAll(/(Q{(.*?)\})/g, '');
  if (tmp === 'root()') return tmp;
  // cut off leading slash
  const tmp1 = tmp.substring(1, tmp.length);
  // ### cut-off root node ref
  return tmp1.substring(tmp1.indexOf('/'), tmp.length);
}

/**
 * @param {Node} node
 * @returns string
 */
export function getDocPath(node) {
  const path = fx.evaluateXPathToString('path()', node);
  // Path is like `$default/x[1]/y[1]`
  const shortened = shortenPath(path);
  return shortened.startsWith('/') ? `${shortened}` : `/${shortened}`;
}

/**
 * @param {Node} node
 * @param {string} instanceId
 * @returns string
 */
export function getPath(node, instanceId) {
  const path = fx.evaluateXPathToString('path()', node);
  // Path is like `$default/x[1]/y[1]`
  const shortened = shortenPath(path);
  return shortened.startsWith('/') ? `$${instanceId}${shortened}` : `$${instanceId}/${shortened}`;
}

/**
 * Checks if a template expression is dynamic, i.e. refers to data (via XPath) or functions.
 * Used to determine whether to set up data observers or evaluate on every refresh.
 *
 * @param {string} expr - The raw XPath expression (from inside `{}`)
 * @returns {boolean} - True if the expression is dynamic (data/function dependent)
 */
export function isDynamic(expr) {
  try {
    const result = evaluateXPathToString(expr, document, null);

    // 1. Check for function calls with non-literal arguments
    const functionCallPattern = /\b([\w-]+)\s*\(\s*([^)]+)\)/g;
    let match;
    while ((match = functionCallPattern.exec(expr)) !== null) {
      const arg = match[2].trim();
      if (!/^(['"]).*\1$/.test(arg) && isNaN(arg)) {
        return true;
      }
    }

    // 2. Check for variable references
    if (expr.includes('$')) return true;

    // 3. Check for unquoted predicates
    let inQuote = false;
    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      if (char === '"' || char === "'") {
        inQuote = inQuote === char ? false : char;
      } else if (!inQuote && char === '[') {
        return true;
      }
    }

    return false;
  } catch {
    return true;
  }
}
