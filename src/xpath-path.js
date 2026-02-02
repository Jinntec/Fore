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
  const s = String(expr ?? '').trim();
  if (s === '') return false;

  const isLiteral = token => {
    const t = token.trim();
    // string literal or number literal
    return /^(['"]).*\1$/.test(t) || /^-?\d+(\.\d+)?$/.test(t);
  };

  const splitArgsTopLevel = argsStr => {
    const args = [];
    let cur = '';
    let depth = 0;
    let quote = null;

    for (let i = 0; i < argsStr.length; i++) {
      const ch = argsStr[i];

      if (quote) {
        cur += ch;
        if (ch === quote) quote = null;
        continue;
      }

      if (ch === '"' || ch === "'") {
        quote = ch;
        cur += ch;
        continue;
      }

      if (ch === '(') {
        depth++;
        cur += ch;
        continue;
      }
      if (ch === ')') {
        depth = Math.max(0, depth - 1);
        cur += ch;
        continue;
      }

      if (ch === ',' && depth === 0) {
        args.push(cur.trim());
        cur = '';
        continue;
      }

      cur += ch;
    }

    if (cur.trim() !== '') args.push(cur.trim());
    return args;
  };

  // 1) variables and predicates => dynamic
  {
    let quote = null;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (quote) {
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      if (ch === '$') return true;
      if (ch === '[') return true;
    }
  }

  // 2) function calls
  // Only treat a small set of known pure string functions as static when all args are literals.
  const staticIfLiteral = new Set(['concat', 'string-length']);

  let quote = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch !== '(') continue;

    // find function name just before '('
    let j = i - 1;
    while (j >= 0 && /\s/.test(s[j])) j--;

    let end = j;
    while (j >= 0 && /[\w:-]/.test(s[j])) j--;

    const fnName = s.slice(j + 1, end + 1);
    if (!fnName) continue;

    // parse argument substring until matching ')'
    let k = i + 1;
    let depth = 1;
    let q2 = null;

    while (k < s.length && depth > 0) {
      const c = s[k];
      if (q2) {
        if (c === q2) q2 = null;
        k++;
        continue;
      }
      if (c === '"' || c === "'") {
        q2 = c;
        k++;
        continue;
      }
      if (c === '(') depth++;
      else if (c === ')') depth--;
      k++;
    }

    const argsStr = s.slice(i + 1, k - 1);
    const fnLower = fnName.toLowerCase();

    // Anything not explicitly “static-if-literal” is dynamic (matches your tests for myfunc(), instance(), index(), etc.)
    if (!staticIfLiteral.has(fnLower)) return true;

    const args = splitArgsTopLevel(argsStr);

    // concat("a","b") is static; concat(foo,"b") is dynamic
    if (fnLower === 'concat') {
      return !args.every(isLiteral);
    }

    // string-length("x") is static; string-length(foo) is dynamic
    if (fnLower === 'string-length') {
      return !(args.length === 1 && isLiteral(args[0]));
    }

    // fallback: be safe
    return true;
  }

  // If none of the dynamic markers matched, it's static
  return false;
}