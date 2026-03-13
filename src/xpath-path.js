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
/**
 * @param {Node} node
 * @param {string} instanceId
 * @returns string
 */
/**
 * Compute a stable Fore path for a node.
 *
 * NOTE:
 * During bind graph build we often deal with XML nodes that live in a separate XML Document
 * (instance document). Those nodes are not in the HTML DOM and therefore cannot "see" <fx-instance>
 * via ancestor traversal, shadow root, or document.querySelector.
 *
 * For that reason, getPath MUST be able to compute $default/... without requiring that an
 * <fx-instance id="default"> element exists in the HTML DOM.
 *
 * @param {Node|any} node
 * @param {string} instanceId
 * @returns {string}
 */
export function getPath(node, instanceId = 'default') {
  const wantedId = (instanceId ?? 'default').trim() || 'default';

  // JSON lens nodes carry their own path – no need to resolve <fx-instance>
  if (node && node.__jsonlens__ === true) {
    return getJsonPath(node);
  }

  // Try to find the corresponding fx-instance in the current HTML document.
  // This is useful for sanity checks / detecting JSON instances, but MUST NOT be required
  // for computing an XML path (especially for the default instance).
  let instanceEl = null;
  try {
    instanceEl = document.querySelector(`fx-instance[id='${wantedId}']`);

    // Many Fore documents use an id-less first instance as the default instance.
    if (!instanceEl && (wantedId === 'default' || wantedId === '')) {
      instanceEl =
        document.querySelector('fx-instance:not([id])') ||
        document.querySelector("fx-instance[id='default']");
    }
  } catch (_e) {
    // ignore
  }

  // If we *did* find an instance element and it is JSON, then the caller is using the wrong node type.
  // (JSON instances are addressed via JSON lens nodes.)
  if (instanceEl) {
    const isJson = instanceEl.getAttribute('type') === 'json' || instanceEl.type === 'json';
    if (isJson) {
      throw new Error(`getPath: Instance '${wantedId}' is JSON but node is not a JSON lens node.`);
    }
  } else {
    // IMPORTANT BEHAVIOR CHANGE:
    // - If default instance element can't be found (common for detached XML documents),
    //   we still compute an XML path. Do NOT throw.
    // - For non-default ids, keep the old strict behavior.
    if (wantedId !== 'default') {
      throw new Error(`Instance with id '${wantedId}' not found.`);
    }
  }

  // XML nodes: compute path purely from the XML tree
  if (node && node.nodeType !== undefined) {
    return getXmlPath(node, wantedId);
  }

  throw new Error('Unsupported node type for getPath');
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

    const end = j;
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
