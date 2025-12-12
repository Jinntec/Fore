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
  const instance = document.querySelector(`fx-instance[id='${instanceId}']`);

  if (!instance) {
    throw new Error(`Instance with id '${instanceId}' not found.`);
  }

  const isJson = instance.getAttribute('type') === 'json';

  if (isJson) {
    // if (typeof node === 'object' && node !== null && node.__jsonlens__ === true) {

    // if (typeof node === 'object' && node !== null && node.__jsonlens__ === true) {
    if (instance.type === 'json') {
      return getJsonPath(node);
    }
    throw new Error('Unsupported node type for JSON instance in getPath');
  } else {
    if (node.nodeType !== undefined) {
      return getXmlPath(node, instanceId);
    }
    throw new Error('Unsupported node type for XML instance in getPath');
  }
}

function getXmlPath(node, instanceId) {
  const path = fx.evaluateXPathToString('path()', node);
  // Path is like `$default/x[1]/y[1]`
  const shortened = shortenPath(path);
  return shortened.startsWith('/') ? `$${instanceId}${shortened}` : `$${instanceId}/${shortened}`;
}

export function getJsonPath(node) {
  if (!node || !node.__jsonlens__) {
    throw new Error('getJsonPath called on non-JSONLens node');
  }

  const pathSegments = [];
  let current = node;
  const instanceId = node.instanceId || 'default';

  while (current && current.parent) {
    const { keyOrIndex, parent } = current;
    if (typeof keyOrIndex === 'number') {
      pathSegments.unshift(`[${keyOrIndex + 1}]`); // XPath is 1-based
    } else {
      pathSegments.unshift(`/${keyOrIndex}`);
    }
    current = parent;
  }

  return pathSegments.length > 0 ? `$${instanceId}${pathSegments.join('')}` : `$${instanceId}/`;
}

/**
 * Parses a JSON-style binding expression like `?automobiles?1?maker`
 * into a list of steps: ['automobiles', 0, 'maker']
 *
 * @param {string} ref
 * @returns {Array<string|number>}
 */
// returns null if it's not a JSON-lens style ref
// otherwise returns { instanceId: string, steps: Array<string|number> }
export function parseJsonRef(ref, defaultInstanceId = 'default') {
  if (!ref) return null;

  const s = String(ref).trim();

  // Optional leading instance('id') / instance("id")
  const instMatch = s.match(/^instance\s*\(\s*(['"])(.*?)\1\s*\)\s*(\?.*)?$/);

  let instanceId;
  let lensPart;

  if (instMatch) {
    instanceId = instMatch[2];
    lensPart = instMatch[3] || '';
  } else {
    // No instance(...): must be a lens ref starting with '?'
    if (!s.startsWith('?')) return null;
    instanceId = defaultInstanceId;
    lensPart = s;
  }

  const steps = lensPart
    .split('?')
    .filter(Boolean)
    .map(part => {
      if (part === '*') return '*';
      if (/^\d+$/.test(part)) return Number(part) - 1; // 1-based -> 0-based
      return part;
    });

  return { instanceId, steps };
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
