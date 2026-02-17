// src/xpath-evaluation.js
// NOTE: This file is intentionally written as plain JS (no JSX) and must parse under Vite.

import {
  evaluateXPath as fxEvaluateXPath,
  evaluateXPathToBoolean as fxEvaluateXPathToBoolean,
  evaluateXPathToFirstNode as fxEvaluateXPathToFirstNode,
  evaluateXPathToNodes as fxEvaluateXPathToNodes,
  evaluateXPathToNumber as fxEvaluateXPathToNumber,
  evaluateXPathToString as fxEvaluateXPathToString,
  evaluateXPathToStrings as fxEvaluateXPathToStrings,
  parseScript,
  registerCustomXPathFunction,
  registerXQueryModule,
  Language,
} from 'fontoxpath';

import * as fx from 'fontoxpath';
import { XPathUtil } from './xpath-util.js';
import { prettifyXml } from './functions/common-function.js';
import { JSONDomFacade } from './json/JSONDomFacade.js';

const XFORMS_NAMESPACE_URI = 'http://www.w3.org/2002/xforms';
const createdNamespaceResolversByXPathQueryAndNode = new Map();

const __jsonDomFacade = new JSONDomFacade();

// ------------------------------------------------------------
// Helpers: Fore/model/instance
// ------------------------------------------------------------

function _getOwningFore(node) {
  let n = node;
  if (!n) return null;

  if (n.nodeType === Node.ATTRIBUTE_NODE) n = n.ownerElement;
  if (n.nodeType === Node.TEXT_NODE) n = n.parentNode;

  // cross shadow
  if (n?.parentNode?.nodeType === Node.DOCUMENT_FRAGMENT_NODE) n = n.parentNode.host;

  return n?.closest ? n.closest('fx-fore') : null;
}

function _getModelFromFormElement(formElement) {
  if (!formElement) return null;

  if (typeof formElement.getModel === 'function') {
    try {
      return formElement.getModel();
    } catch (_e) {}
  }

  const fore = _getOwningFore(formElement);
  if (fore && typeof fore.getModel === 'function') {
    try {
      return fore.getModel();
    } catch (_e) {
      return null;
    }
  }

  return null;
}

function _getInstanceFromFormElement(formElement, instanceId) {
  const model = _getModelFromFormElement(formElement);
  if (!model || typeof model.getInstance !== 'function') return null;
  try {
    return model.getInstance(instanceId);
  } catch (_e) {
    return null;
  }
}

// IMPORTANT: source of truth is instance.type / @type
function _isJsonInstance(instance) {
  if (!instance) return false;
  const t =
    (typeof instance.getAttribute === 'function' && instance.getAttribute('type')) ||
    instance.type ||
    '';
  return t === 'json';
}

function _isJsonNode(n) {
  return !!n && typeof n === 'object' && n.__jsonlens__ === true;
}

function _getJsonRootNode(instance) {
  return instance?.nodeset && _isJsonNode(instance.nodeset) ? instance.nodeset : null;
}

/**
 * Avoid calling any instance getters here.
 * Some FxInstance implementations rebuild lenses / trigger evaluation in getters,
 * which can recurse into XPath evaluation and overflow the stack.
 */
function _getRawJsonRootValue(instance) {
  if (!instance) return null;

  // Canonical backing field in FxInstance
  if (instance._instanceData !== undefined) return instance._instanceData;

  // Alternate field name
  if (instance.jsonData !== undefined) return instance.jsonData;

  // Last fallback: unwrap a JSONNode root
  if (instance.nodeset && instance.nodeset.__jsonlens__ === true) return instance.nodeset.value;

  return null;
}

// ------------------------------------------------------------
// Index('repeat') without XPath evaluation (prevents recursion)
// ------------------------------------------------------------

function _matchIndexExpr(expr) {
  const s = String(expr ?? '').trim();
  const m = s.match(/^index\s*\(\s*(['"])(.*?)\1\s*\)\s*$/);
  return m ? m[2] : null;
}

export function resolveId(id, sourceObject, nodeName = null) {
  const query =
    'outermost(ancestor-or-self::fx-fore[1]/(descendant::fx-fore|descendant::*[@id = $id]))[not(self::fx-fore)]';

  if (sourceObject.nodeType === Node.TEXT_NODE) {
    sourceObject = sourceObject.parentNode;
  }
  if (sourceObject.nodeType === Node.ATTRIBUTE_NODE) {
    sourceObject = sourceObject.ownerElement;
  }
  if (sourceObject.parentNode?.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    sourceObject = sourceObject.parentNode.host;
  }

  const ownerForm =
    sourceObject.localName === 'fx-fore' ? sourceObject : sourceObject.closest('fx-fore');

  const elementsWithId = ownerForm.querySelectorAll(`[id='${id}']`);
  if (elementsWithId.length === 1) {
    const targetObject = elementsWithId[0];
    if (nodeName && targetObject.localName !== nodeName) return null;
    return targetObject;
  }

  const allMatchingTargetObjects = fxEvaluateXPathToNodes(
    query,
    sourceObject,
    null,
    { id },
    { namespaceResolver: xhtmlNamespaceResolver },
  );
  if (allMatchingTargetObjects.length === 0) return null;

  if (
    allMatchingTargetObjects.length === 1 &&
    fxEvaluateXPathToBoolean(
      '(ancestor::fx-fore | ancestor::fx-repeat)[last()]/self::fx-fore',
      allMatchingTargetObjects[0],
      null,
      null,
      { namespaceResolver: xhtmlNamespaceResolver },
    )
  ) {
    const targetObject = allMatchingTargetObjects[0];
    if (nodeName && targetObject.localName !== nodeName) return null;
    return targetObject;
  }

  for (const ancestorRepeatItem of fxEvaluateXPathToNodes(
    'ancestor::fx-repeatitem => reverse()',
    sourceObject,
    null,
    null,
    { namespaceResolver: xhtmlNamespaceResolver },
  )) {
    const foundTargetObjects = allMatchingTargetObjects.filter(to =>
      XPathUtil.contains(ancestorRepeatItem, to),
    );
    switch (foundTargetObjects.length) {
      case 0:
        break;
      case 1: {
        const targetObject = foundTargetObjects[0];
        if (nodeName && targetObject.localName !== nodeName) return null;
        return targetObject;
      }
      default: {
        const targetObject = foundTargetObjects.find(to =>
          fxEvaluateXPathToNodes(
            'every $ancestor of ancestor::fx-repeatitem satisfies $ancestor is $ancestor/../child::fx-repeatitem[../@repeat-index]',
            to,
            null,
            {},
          ),
        );
        if (!targetObject) return null;
        if (nodeName && targetObject.localName !== nodeName) return null;
        return targetObject;
      }
    }
  }

  return null;
}

/**
 * Resolve index('repeatId') without evaluating XPath (prevents recursion).
 * Returns:
 *  - null   => not an index() expr
 *  - number => resolved index (defaults to 1)
 */
function tryResolveIndexExpr(expr, formElementOrNode) {
  try {
    const repeatId = _matchIndexExpr(expr);
    if (!repeatId) return null;

    const source = formElementOrNode?.nodeType
      ? formElementOrNode
      : _getOwningFore(formElementOrNode);

    const repeat =
      (source && resolveId(repeatId, source, 'fx-repeat')) ||
      _getOwningFore(source)?.querySelector?.(`#${CSS.escape(repeatId)}`);

    if (!repeat) return 1;

    const attr = repeat.getAttribute('index') ?? repeat.getAttribute('repeat-index');
    let idx = Number(attr);

    if (!Number.isFinite(idx) || idx < 1) {
      if (typeof repeat.getIndex === 'function') idx = Number(repeat.getIndex());
      else idx = Number(repeat.index);
    }

    return Number.isFinite(idx) && idx >= 1 ? idx : 1;
  } catch (_e) {
    return null;
  }
}

// ------------------------------------------------------------
// JSON lookup handling
// ------------------------------------------------------------

function _looksLikeLookupExpr(expr) {
  const s = String(expr ?? '').trim();
  return s.includes('?');
}

/**
 * Split "…?*[(predicate)]" => { base: "…?*", predicate: "(predicate)" }
 * Works for:
 *   instance('data')?movies?*[true()]
 *   ?movies?*[instance('data')?ui?query = 'Ma']
 */
function _splitStarPredicate(expr) {
  const s = String(expr ?? '').trim();
  const m = s.match(/^(.*\?\*)\s*\[\s*([\s\S]+?)\s*\]\s*$/);
  if (!m) return null;
  return { base: m[1].trim(), predicate: m[2].trim() };
}

/**
 * Determine whether expression is a "simple navigation" lens path that can be resolved
 * by JSONNode.get chain:
 * - no "*[predicate]" (handled separately)
 * - no operators
 * - no function calls beyond instance()/index()
 * - predicates allowed ONLY in form "prop[NUMBER]" or "prop[index('repeat')]"
 */
function _isSimpleLookupExpr(expr) {
  const s = String(expr ?? '').trim();

  // star predicate is not simple (handled by _splitStarPredicate path)
  if (/\?\*\s*\[/.test(s)) return false;

  // operators => not simple
  if (/[=<>!]=|[=<>]/.test(s)) return false;

  // function calls other than instance()/index() => not simple
  const parens = s.match(/[a-zA-Z_][\w.-]*\s*\(/g) || [];
  const otherCalls = parens.filter(m => !/^instance\s*\(/.test(m) && !/^index\s*\(/.test(m));
  if (otherCalls.length) return false;

  // bracket predicates allowed only as array access
  if (/\[[\s\S]*\]/.test(s)) {
    const steps = s.split('?').filter(Boolean);
    for (const step of steps) {
      const bm = step.match(/^(.*?)\[(.+)\]$/);
      if (!bm) continue;
      const inside = bm[2].trim();
      if (/^\d+$/.test(inside)) continue;
      if (_matchIndexExpr(inside)) continue;
      // allow index("x") too
      if (/^index\s*\(\s*(['"])(.*?)\1\s*\)\s*$/.test(inside)) continue;
      return false;
    }
  }

  return true;
}

function _parseSimpleLookupPath(expr) {
  const s = String(expr ?? '').trim();

  let instanceId = null;
  let rest = s;

  const instExplicit = s.match(/^instance\s*\(\s*(['"])(.*?)\1\s*\)\s*(\?.*)$/);
  if (instExplicit) {
    instanceId = instExplicit[2];
    rest = instExplicit[3];
  } else {
    const instDefault = s.match(/^instance\s*\(\s*\)\s*(\?.*)$/);
    if (instDefault) {
      instanceId = 'default';
      rest = instDefault[1];
    } else if (s.startsWith('.?')) rest = s.slice(1);
    else if (!s.startsWith('?')) return null;
  }

  const steps = rest
    .split('?')
    .filter(Boolean)
    .map(part => part.trim())
    .filter(Boolean);

  return { instanceId, steps, hasExplicitInstance: !!instExplicit };
}

function _getInstanceIdForLookupExpr(expr0, formElement) {
  const parsed = _parseSimpleLookupPath(expr0);
  if (parsed && parsed.instanceId) return parsed.instanceId;
  return XPathUtil.getInstanceId(expr0, formElement);
}

function _isRelativeJsonLookup(expr0, contextNode) {
  const s = String(expr0 ?? '').trim();
  // relative lookup: starts with ? or .?
  if (!(s.startsWith('?') || s.startsWith('.?'))) return false;
  return _isJsonNode(contextNode);
}

function _resolveBracketIndex1(idxExpr, formElement) {
  const t = String(idxExpr ?? '').trim();
  if (/^\d+$/.test(t)) return Number(t);

  // index('movies')
  const rid = _matchIndexExpr(t);
  if (rid) return tryResolveIndexExpr(`index('${rid}')`, formElement) ?? 1;

  // index("movies")
  const m = t.match(/^index\s*\(\s*(['"])(.*?)\1\s*\)\s*$/);
  if (m) return tryResolveIndexExpr(`index('${m[2]}')`, formElement) ?? 1;

  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function _resolveSimpleLookupToJsonNode(expr, contextNode, formElement) {
  const parsed = _parseSimpleLookupPath(expr);
  if (!parsed) return null;

  const trimmed = String(expr ?? '').trim();
  const isExplicitInstance = trimmed.startsWith('instance(');

  const getChildren = n => {
    if (!n) return [];
    if (typeof n.getChildren === 'function') return n.getChildren() || [];
    return Array.isArray(n.children) ? n.children : [];
  };

  // Establish the starting node:
  // 1) If expression explicitly names an instance => use that instance root
  // 2) Else if we already have a JSONNode context => resolve relative to it
  // 3) Else fall back to instance id derived from expression/default
  let node = null;

  if (parsed.instanceId) {
    // instance('id')?... or instance()?...
    const instance = _getInstanceFromFormElement(formElement, parsed.instanceId);
    if (!_isJsonInstance(instance)) return null;
    node = _getJsonRootNode(instance);
    if (!node) return null;
  } else if (!isExplicitInstance && _isJsonNode(contextNode)) {
    // Relative lookup: ?foo?bar / .?foo?bar
    node = contextNode;
  } else {
    // No explicit instance and no JSON context => resolve via instance id util
    const fallbackId = XPathUtil.getInstanceId(expr, formElement) || 'default';
    const instance = _getInstanceFromFormElement(formElement, fallbackId);
    if (!_isJsonInstance(instance)) return null;
    node = _getJsonRootNode(instance);
    if (!node) return null;
  }

  for (const rawStep of parsed.steps) {
    if (!node) return null;

    const step = String(rawStep);

    if (step === '*') {
      return getChildren(node);
    }

    if (/^\d+$/.test(step)) {
      const idx0 = Number(step) - 1;
      node = node.get?.(idx0) || null;
      continue;
    }

    const bm = step.match(/^(.*?)\[(.+)\]$/);
    if (bm) {
      const prop = bm[1].trim();
      const idxExpr = bm[2].trim();

      const container = prop ? (typeof node.get === 'function' ? node.get(prop) : null) : node;
      if (!container) return null;

      const arrVal = container.value;
      if (!Array.isArray(arrVal)) return null;

      const idx1 = _resolveBracketIndex1(idxExpr, formElement);
      if (!Number.isFinite(idx1) || idx1 < 1) return null;

      const idx0 = idx1 - 1;
      node = container.get?.(idx0) || null;
      continue;
    }

    node = node.get?.(step) || null;
  }

  if (!node) return null;

  if (Array.isArray(node.value)) return getChildren(node);

  return node;
}
// ------------------------------------------------------------
// RAW JSON evaluation helpers (FontoXPath over JS values)
// ------------------------------------------------------------

function getVariablesInScope(formElement) {
  let closestActualFormElement = formElement;
  while (closestActualFormElement && !('inScopeVariables' in closestActualFormElement)) {
    closestActualFormElement =
      closestActualFormElement.nodeType === Node.ATTRIBUTE_NODE
        ? closestActualFormElement.ownerElement
        : closestActualFormElement.parentNode;
  }

  if (!closestActualFormElement) return {};

  const variables = {};
  if (closestActualFormElement.inScopeVariables) {
    for (const key of closestActualFormElement.inScopeVariables.keys()) {
      const varElementOrValue = closestActualFormElement.inScopeVariables.get(key);
      if (!varElementOrValue) continue;

      if (varElementOrValue.nodeType) variables[key] = varElementOrValue.value;
      else variables[key] = varElementOrValue;
    }
  }
  return variables;
}

// ------------------------------------------------------------
// Namespace resolver infra (XML only)
// ------------------------------------------------------------

const xhtmlNamespaceResolver = prefix => {
  if (!prefix) return 'http://www.w3.org/1999/xhtml';
  return undefined;
};

export function isInShadow(node) {
  return node.getRootNode() instanceof ShadowRoot;
}

const xmlDocument = new DOMParser().parseFromString('<xml />', 'text/xml');
const instanceReferencesByQuery = new Map();

function findInstanceReferences(xpathQuery) {
  if (!xpathQuery.includes('instance')) return [];
  if (instanceReferencesByQuery.has(xpathQuery)) return instanceReferencesByQuery.get(xpathQuery);

  const xpathAST = parseScript(xpathQuery, {}, xmlDocument);
  const instanceReferences = fxEvaluateXPathToStrings(
    `descendant::xqx:functionCallExpr
				[xqx:functionName = "instance"]
				/xqx:arguments
				/xqx:stringConstantExpr
				/xqx:value`,
    xpathAST,
    null,
    {},
    {
      namespaceResolver: prefix =>
        prefix === 'xqx' ? 'http://www.w3.org/2005/XQueryX' : undefined,
    },
  );

  instanceReferencesByQuery.set(xpathQuery, instanceReferences);
  return instanceReferences;
}

function getCachedNamespaceResolver(xpath, node) {
  if (!createdNamespaceResolversByXPathQueryAndNode.has(xpath)) return null;
  return createdNamespaceResolversByXPathQueryAndNode.get(xpath).get(node) || null;
}

function setCachedNamespaceResolver(xpath, node, resolver) {
  if (!createdNamespaceResolversByXPathQueryAndNode.has(xpath)) {
    createdNamespaceResolversByXPathQueryAndNode.set(xpath, new Map());
  }
  createdNamespaceResolversByXPathQueryAndNode.get(xpath).set(node, resolver);
}

export function createNamespaceResolver(xpathQuery, formElement) {
  const cachedResolver = getCachedNamespaceResolver(xpathQuery, formElement);
  if (cachedResolver) return cachedResolver;

  const provisionalResolver = prefix => (prefix ? undefined : '');
  setCachedNamespaceResolver(xpathQuery, formElement, provisionalResolver);

  let instanceReferences = findInstanceReferences(xpathQuery);

  const closestRefExcludingSelf = el => {
    if (!el) return null;

    let n = el;
    if (n.nodeType === Node.ATTRIBUTE_NODE) n = n.ownerElement;
    if (n?.parentNode?.nodeType === Node.DOCUMENT_FRAGMENT_NODE) n = n.parentNode.host;

    let start = n?.parentNode;
    if (start?.nodeType === Node.DOCUMENT_FRAGMENT_NODE) start = start.host;

    return start?.closest ? start.closest('[ref]') : null;
  };

  if (instanceReferences.length === 0) {
    const ancestorComponent = closestRefExcludingSelf(formElement);

    if (ancestorComponent && ancestorComponent !== formElement) {
      const ancestorRef = ancestorComponent.getAttribute('ref');
      if (ancestorRef && ancestorRef !== xpathQuery) {
        const resolver = createNamespaceResolver(ancestorRef, ancestorComponent);
        setCachedNamespaceResolver(xpathQuery, formElement, resolver);
        return resolver;
      }
    }

    instanceReferences = ['default'];
  }

  if (instanceReferences.length === 1) {
    let instance;
    if (instanceReferences[0] === 'default') {
      const actualForeElement = fxEvaluateXPathToFirstNode(
        'ancestor-or-self::fx-fore[1]',
        formElement,
        null,
        null,
        { namespaceResolver: xhtmlNamespaceResolver },
      );
      instance = actualForeElement && actualForeElement.querySelector('fx-instance');
    } else {
      instance = resolveId(instanceReferences[0], formElement, 'fx-instance');
    }

    if (instance && instance.hasAttribute('xpath-default-namespace')) {
      const xpathDefaultNamespace = instance.getAttribute('xpath-default-namespace');
      const resolveNamespacePrefix = prefix => (!prefix ? xpathDefaultNamespace : undefined);
      setCachedNamespaceResolver(xpathQuery, formElement, resolveNamespacePrefix);
      return resolveNamespacePrefix;
    }
  }

  const xpathDefaultNamespace =
    fxEvaluateXPathToString('ancestor-or-self::*/@xpath-default-namespace[last()]', formElement) ||
    '';

  const resolveNamespacePrefix = function resolveNamespacePrefix(prefix) {
    if (prefix === '') return xpathDefaultNamespace;

    return fxEvaluateXPathToString(
      'ancestor-or-self::*/@*[name() = "xmlns:" || $prefix][last()]',
      formElement,
      null,
      { prefix },
    );
  };

  setCachedNamespaceResolver(xpathQuery, formElement, resolveNamespacePrefix);
  return resolveNamespacePrefix;
}

function createNamespaceResolverForNode(query, contextNode, formElement) {
  if (((contextNode && contextNode.ownerDocument) || contextNode) === window.document) {
    return xhtmlNamespaceResolver;
  }
  return createNamespaceResolver(query, formElement);
}

// ------------------------------------------------------------
// Function resolver
// ------------------------------------------------------------

export const globallyDeclaredFunctionLocalNames = [];

function functionNameResolver({ prefix, localName }, _arity) {
  switch (localName) {
    case 'context':
    case 'base64encode':
    case 'boolean-from-string':
    case 'current':
    case 'depends':
    case 'event':
    case 'fore-attr':
    case 'index':
    case 'instance':
    case 'json2xml':
    case 'xml2Json':
    case 'log':
    case 'parse':
    case 'local-date':
    case 'local-dateTime':
    case 'logtree':
    case 'uri':
    case 'uri-fragment':
    case 'uri-host':
    case 'uri-param':
    case 'uri-path':
    case 'uri-relpath':
    case 'uri-port':
    case 'uri-query':
    case 'uri-scheme':
    case 'uri-scheme-specific-part':
      return { namespaceURI: XFORMS_NAMESPACE_URI, localName };
    default:
      if (prefix === '' && globallyDeclaredFunctionLocalNames.includes(localName)) {
        return { namespaceURI: 'http://www.w3.org/2005/xquery-local-functions', localName };
      }
      if (prefix === 'fn' || prefix === '') {
        return { namespaceURI: 'http://www.w3.org/2005/xpath-functions', localName };
      }
      if (prefix === 'local') {
        return { namespaceURI: 'http://www.w3.org/2005/xquery-local-functions', localName };
      }
      return null;
  }
}

// ------------------------------------------------------------
// JSON star-predicate filtering using FontoXPath per item
// ------------------------------------------------------------

function _jsonAtomicFromResolved(resolved) {
  if (resolved === null || resolved === undefined) return '';

  // Arrays: join atomic values with spaces (XPath-ish).
  if (Array.isArray(resolved)) {
    return resolved
      .map(r => _jsonAtomicFromResolved(r))
      .filter(s => s !== null && s !== undefined && s !== '')
      .join(' ');
  }

  // JSONNode: prefer getValue() if present.
  if (_isJsonNode(resolved)) {
    const v = typeof resolved.getValue === 'function' ? resolved.getValue() : resolved.value;

    if (v === null || v === undefined) return '';

    const t = typeof v;
    if (t === 'string') return v;
    if (t === 'number' || t === 'boolean' || t === 'bigint') return String(v);

    try {
      return JSON.stringify(v);
    } catch (_e) {
      return '';
    }
  }

  // Primitives
  const t = typeof resolved;
  if (t === 'string') return resolved;
  if (t === 'number' || t === 'boolean' || t === 'bigint') return String(resolved);

  // Other objects
  try {
    return JSON.stringify(resolved);
  } catch (_e) {
    return String(resolved);
  }
}
function _materializeInstanceLookupsInPredicate(predicateExpr, currentJsonNode, formElement) {
  const src = String(predicateExpr ?? '');
  let out = '';
  const extraVars = {};
  let varCount = 0;

  let inSingle = false;
  let inDouble = false;

  const isBoundary = ch =>
    ch === undefined ||
    ch === null ||
    /\s/.test(ch) ||
    ch === ',' ||
    ch === ')' ||
    ch === ']' ||
    ch === '+' ||
    ch === '-' ||
    ch === '*' ||
    ch === '=' ||
    ch === '>' ||
    ch === '<' ||
    ch === '!' ||
    ch === '|' ||
    ch === '&';

  function readInstanceLensAt(start) {
    // Reads `instance(...)` followed by one or more `?step` parts.
    if (!src.slice(start).match(/^instance\s*\(/)) return null;

    // Find matching ')'
    let j = start;
    let inS = false;
    let inD = false;
    let depth = 0;

    while (j < src.length) {
      const ch = src[j];

      if (ch === "'" && !inD) {
        inS = !inS;
        j += 1;
        continue;
      }
      if (ch === '"' && !inS) {
        inD = !inD;
        j += 1;
        continue;
      }
      if (inS || inD) {
        j += 1;
        continue;
      }

      if (ch === '(') depth += 1;
      else if (ch === ')') {
        depth -= 1;
        if (depth === 0) break;
      }
      j += 1;
    }

    if (j >= src.length) return null;

    // Must be followed by '?' (after optional whitespace)
    let k = j + 1;
    while (k < src.length && /\s/.test(src[k])) k += 1;
    if (src[k] !== '?') return null;

    // Consume until boundary, respecting bracket depth and quotes
    k += 1;
    let bracketDepth = 0;
    inS = false;
    inD = false;

    while (k < src.length) {
      const ch = src[k];

      if (ch === "'" && !inD) {
        inS = !inS;
        k += 1;
        continue;
      }
      if (ch === '"' && !inS) {
        inD = !inD;
        k += 1;
        continue;
      }
      if (inS || inD) {
        k += 1;
        continue;
      }

      if (ch === '[') bracketDepth += 1;
      else if (ch === ']') {
        if (bracketDepth > 0) bracketDepth -= 1;
        else break;
      }

      if (bracketDepth === 0 && isBoundary(ch)) break;
      k += 1;
    }

    return { raw: src.slice(start, k), end: k };
  }

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      out += ch;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      out += ch;
      continue;
    }

    if (!inSingle && !inDouble) {
      const lens = readInstanceLensAt(i);
      if (lens && _looksLikeLookupExpr(lens.raw) && _isSimpleLookupExpr(lens.raw)) {
        const varName = `__fxp${varCount++}`;

        // Resolve the lookup using the existing JSON lens resolver.
        const resolved = _resolveSimpleLookupToJsonNode(lens.raw, currentJsonNode, formElement);
        extraVars[varName] = _jsonAtomicFromResolved(resolved);

        out += `$${varName}`;
        i = lens.end - 1;
        continue;
      }
    }

    out += ch;
  }

  return { expr: out.trim(), extraVars };
}

function _filterJsonNodesByPredicate(nodes, predicateExpr, formElement, variables = {}) {
  const pred = String(predicateExpr ?? '').trim();

  // Fast paths: avoid swallowing errors and filtering out everything.
  if (pred === 'true()' || pred === 'true') {
    return (nodes || []).filter(_isJsonNode);
  }
  if (pred === 'false()' || pred === 'false') {
    return [];
  }

  // Special-case: contains(., <something>) used by json-movies-explorer search.
  // This does NOT attempt to be a full XPath predicate engine; it is a safe, deterministic
  // shortcut that prevents "no rows" when DOMFacade support is incomplete.
  const containsMatch = pred.match(/^contains\s*\(\s*\.\s*,\s*([\s\S]+)\s*\)\s*$/);
  if (containsMatch) {
    const rhs = containsMatch[1].trim();

    return (nodes || []).filter(n => {
      if (!_isJsonNode(n)) return false;

      // resolve RHS to a string needle
      let needle = '';
      const quoted = rhs.match(/^(['"])([\s\S]*)\1$/);
      if (quoted) {
        needle = String(quoted[2] ?? '');
      } else {
        // If RHS is a lens expression, resolve it (instance('data')?ui?query, ?query, etc.)
        // Use the current item node as context for relative lookups.
        const resolved = _looksLikeLookupExpr(rhs)
          ? _resolveSimpleLookupToJsonNode(rhs, n, formElement)
          : null;

        needle = _jsonAtomicFromResolved(resolved);

        // Also allow variable references like $q in predicates
        if (!needle && rhs.startsWith('$')) {
          const key = rhs.slice(1);
          const inScope = getVariablesInScope(formElement);
          const v =
            (variables && key in variables ? variables[key] : null) ??
            (key in inScope ? inScope[key] : null);
          needle = _jsonAtomicFromResolved(v);
        }
      }

      // XPath contains(haystack,'') is true
      if (needle === '') return true;

      // haystack: stringify the whole item (so search matches anywhere)
      const v = typeof n.getValue === 'function' ? n.getValue() : n.value;
      let haystack = '';
      if (v === null || v === undefined) haystack = '';
      else if (typeof v === 'string') haystack = v;
      else {
        try {
          haystack = JSON.stringify(v);
        } catch (_e) {
          haystack = String(v);
        }
      }

      return haystack.includes(needle);
    });
  }

  // General case: evaluate predicate using FontoXPath against the JSONNode
  // (keeps full function/variable support when DOMFacade is sufficient).
  const inScope = getVariablesInScope(formElement);
  const domFacade = __jsonDomFacade;

  const out = [];
  for (const n of nodes || []) {
    if (!_isJsonNode(n)) continue;

    try {
      // Replace instance(...)?... lookups inside predicate with variables so FontoXPath
      // does not need to understand the lookup operator.
      const { expr: predExpr, extraVars } = _materializeInstanceLookupsInPredicate(
        pred,
        n,
        formElement,
      );
      const mergedVars = { ...inScope, ...variables, ...extraVars };

      const ok = fxEvaluateXPathToBoolean(predExpr, n, domFacade, mergedVars, {
        currentContext: { formElement },
        moduleImports: { xf: XFORMS_NAMESPACE_URI },
        functionNameResolver,
        namespaceResolver: null,
        language: Language.XPATH_3_1_LANGUAGE,
        xmlSerializer: new XMLSerializer(),
      });

      if (ok) out.push(n);
    } catch (_e) {
      // If predicate evaluation fails, treat as false for that item.
    }
  }

  return out;
}

// ------------------------------------------------------------
// Exported evaluation helpers
// ------------------------------------------------------------

export function evaluateXPath(
  xpath,
  contextNode,
  formElement,
  variables = {},
  options = {},
  domFacade = null,
) {
  const expr0 = String(xpath ?? '').trim();

  try {
    const idx = tryResolveIndexExpr(expr0, formElement);
    if (idx !== null) return [idx];

    // Fast-path: evaluating '.' on a JSONNode should just yield the current node.
    // Doing this through FontoXPath can recurse into refresh and overflow the stack.
    if (_isJsonNode(contextNode) && expr0 === '.') {
      return [contextNode];
    }

    // If we are evaluating in a JSON repeat/item context, use the JSON DOM facade
    // even for non-lookup expressions like `name` / `value`.
    if (_isJsonNode(contextNode) && !_looksLikeLookupExpr(expr0)) {
      const variablesInScope = getVariablesInScope(formElement);
      return fxEvaluateXPath(
        expr0,
        contextNode,
        __jsonDomFacade,
        { ...variablesInScope, ...variables },
        fxEvaluateXPath.ALL_RESULTS_TYPE,
        {
          debug: true,
          currentContext: { formElement, variables },
          moduleImports: { xf: XFORMS_NAMESPACE_URI },
          functionNameResolver,
          namespaceResolver: null,
          language: Language.XPATH_3_1_LANGUAGE,
          xmlSerializer: new XMLSerializer(),
          ...options,
        },
      );
    }

    if (_looksLikeLookupExpr(expr0)) {
      const relativeJson = _isRelativeJsonLookup(expr0, contextNode);

      // Only attempt to resolve an instance when this is not a relative lookup.
      const instanceId = relativeJson ? null : _getInstanceIdForLookupExpr(expr0, formElement);
      const instance = relativeJson ? null : _getInstanceFromFormElement(formElement, instanceId);

      if (!relativeJson && !instance) {
        formElement?.dispatchEvent?.(
          new CustomEvent('error', {
            composed: false,
            bubbles: true,
            detail: {
              origin: formElement,
              message: `Instance with id '${instanceId}' not found for expression '${expr0}'`,
              expr: expr0,
              level: 'Error',
            },
          }),
        );
      }

      if (relativeJson || _isJsonInstance(instance)) {
        // ✅ Star predicate: resolve base nodeset via lens, then filter with real XPath predicate per item.
        const sp = _splitStarPredicate(expr0);
        if (sp) {
          const baseResolved = _resolveSimpleLookupToJsonNode(sp.base, contextNode, formElement);
          const baseNodes = Array.isArray(baseResolved)
            ? baseResolved
            : baseResolved
              ? [baseResolved]
              : [];
          return _filterJsonNodesByPredicate(baseNodes, sp.predicate, formElement, variables);
        }

        // ✅ Simple navigation (no predicates/operators)
        if (_isSimpleLookupExpr(expr0)) {
          const resolved = _resolveSimpleLookupToJsonNode(expr0, contextNode, formElement);
          if (resolved === null) return [];
          if (Array.isArray(resolved)) return resolved;
          return [resolved];
        }

        return [];
      }
    }

    const namespaceResolver = createNamespaceResolverForNode(expr0, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    return fxEvaluateXPath(
      expr0,
      contextNode,
      domFacade,
      { ...variablesInScope, ...variables },
      fxEvaluateXPath.ALL_RESULTS_TYPE,
      {
        debug: true,
        currentContext: { formElement, variables },
        moduleImports: { xf: XFORMS_NAMESPACE_URI },
        functionNameResolver,
        namespaceResolver,
        language: Language.XPATH_3_1_LANGUAGE,
        xmlSerializer: new XMLSerializer(),
        ...options,
      },
    );
  } catch (e) {
    formElement?.dispatchEvent?.(
      new CustomEvent('error', {
        composed: false,
        bubbles: true,
        detail: {
          origin: formElement,
          message: `Expression '${xpath}' failed: ${e}`,
          expr: xpath,
          level: 'Error',
        },
      }),
    );
    return [];
  }
}

export function evaluateXPathToFirstNode(xpath, contextNode, formElement) {
  const expr0 = String(xpath ?? '').trim();

  try {
    if (_isJsonNode(contextNode) && expr0 === '.') {
      return contextNode;
    }
    if (_isJsonNode(contextNode) && !_looksLikeLookupExpr(expr0)) {
      const variablesInScope = getVariablesInScope(formElement);
      return fxEvaluateXPathToFirstNode(expr0, contextNode, __jsonDomFacade, variablesInScope, {
        currentContext: { formElement },
        functionNameResolver,
        moduleImports: { xf: XFORMS_NAMESPACE_URI },
        namespaceResolver: null,
        language: Language.XPATH_3_1_LANGUAGE,
        xmlSerializer: new XMLSerializer(),
      });
    }

    if (_looksLikeLookupExpr(expr0)) {
      const relativeJson = _isRelativeJsonLookup(expr0, contextNode);
      const instanceId = relativeJson ? null : _getInstanceIdForLookupExpr(expr0, formElement);
      const instance = relativeJson ? null : _getInstanceFromFormElement(formElement, instanceId);

      if (relativeJson || _isJsonInstance(instance)) {
        const sp = _splitStarPredicate(expr0);
        if (sp) {
          const baseResolved = _resolveSimpleLookupToJsonNode(sp.base, contextNode, formElement);
          const baseNodes = Array.isArray(baseResolved)
            ? baseResolved
            : baseResolved
              ? [baseResolved]
              : [];
          const filtered = _filterJsonNodesByPredicate(baseNodes, sp.predicate, formElement);
          return filtered[0] || null;
        }

        if (_isSimpleLookupExpr(expr0)) {
          const resolved = _resolveSimpleLookupToJsonNode(expr0, contextNode, formElement);
          if (!resolved) return null;
          if (Array.isArray(resolved)) return resolved[0] || null;
          return resolved;
        }

        return null;
      }
    }

    const namespaceResolver = createNamespaceResolverForNode(expr0, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    return fxEvaluateXPathToFirstNode(expr0, contextNode, null, variablesInScope, {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: { xf: XFORMS_NAMESPACE_URI },
      namespaceResolver,
      language: Language.XPATH_3_1_LANGUAGE,
      xmlSerializer: new XMLSerializer(),
    });
  } catch (e) {
    formElement?.dispatchEvent?.(
      new CustomEvent('error', {
        composed: false,
        bubbles: true,
        detail: {
          origin: formElement,
          message: `Expression '${xpath}' failed: ${e}`,
          expr: xpath,
          level: 'Error',
        },
      }),
    );
    return null;
  }
}

export function evaluateXPathToNodes(xpath, contextNode, formElement) {
  const expr0 = String(xpath ?? '').trim();

  try {
    if (_isJsonNode(contextNode) && expr0 === '.') {
      return [contextNode];
    }
    if (_isJsonNode(contextNode) && !_looksLikeLookupExpr(expr0)) {
      const variablesInScope = getVariablesInScope(formElement);
      return fxEvaluateXPathToNodes(expr0, contextNode, __jsonDomFacade, variablesInScope, {
        currentContext: { formElement },
        functionNameResolver,
        moduleImports: { xf: XFORMS_NAMESPACE_URI },
        namespaceResolver: null,
        language: Language.XPATH_3_1_LANGUAGE,
        xmlSerializer: new XMLSerializer(),
      });
    }

    if (_looksLikeLookupExpr(expr0)) {
      const relativeJson = _isRelativeJsonLookup(expr0, contextNode);
      const instanceId = relativeJson ? null : _getInstanceIdForLookupExpr(expr0, formElement);
      const instance = relativeJson ? null : _getInstanceFromFormElement(formElement, instanceId);

      if (relativeJson || _isJsonInstance(instance)) {
        const sp = _splitStarPredicate(expr0);
        if (sp) {
          const baseResolved = _resolveSimpleLookupToJsonNode(sp.base, contextNode, formElement);
          const baseNodes = Array.isArray(baseResolved)
            ? baseResolved
            : baseResolved
              ? [baseResolved]
              : [];
          return _filterJsonNodesByPredicate(baseNodes, sp.predicate, formElement);
        }

        if (_isSimpleLookupExpr(expr0)) {
          const resolved = _resolveSimpleLookupToJsonNode(expr0, contextNode, formElement);
          if (!resolved) return [];
          if (Array.isArray(resolved)) return resolved;
          return [resolved];
        }

        return [];
      }
    }

    const namespaceResolver = createNamespaceResolverForNode(expr0, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    return fxEvaluateXPathToNodes(expr0, contextNode, null, variablesInScope, {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: { xf: XFORMS_NAMESPACE_URI },
      namespaceResolver,
      language: Language.XPATH_3_1_LANGUAGE,
      xmlSerializer: new XMLSerializer(),
    });
  } catch (e) {
    formElement?.dispatchEvent?.(
      new CustomEvent('error', {
        composed: false,
        bubbles: true,
        detail: {
          origin: formElement,
          message: `Expression '${xpath}' failed: ${e}`,
          expr: xpath,
          level: 'Error',
        },
      }),
    );
    return [];
  }
}

export function evaluateXPathToBoolean(xpath, contextNode, formElement) {
  const expr0 = String(xpath ?? '').trim();

  try {
    const idx = tryResolveIndexExpr(expr0, formElement);
    if (idx !== null) return Boolean(idx);

    if (_isJsonNode(contextNode) && expr0 === '.') {
      return true;
    }

    // ------------------------------------------------------------
    // JSON CONTEXT
    // ------------------------------------------------------------
    if (_isJsonNode(contextNode)) {
      // 1) Star predicate (repeat filtering style): ?movies?*[ ... ]
      if (_looksLikeLookupExpr(expr0)) {
        const sp = _splitStarPredicate(expr0);
        if (sp) {
          const baseResolved = _resolveSimpleLookupToJsonNode(sp.base, contextNode, formElement);
          const baseNodes = Array.isArray(baseResolved)
            ? baseResolved
            : baseResolved
              ? [baseResolved]
              : [];
          return _filterJsonNodesByPredicate(baseNodes, sp.predicate, formElement).length > 0;
        }

        // 2) Simple navigation lookup: ?title, instance('data')?ui?query, etc.
        if (_isSimpleLookupExpr(expr0)) {
          const resolved = _resolveSimpleLookupToJsonNode(expr0, contextNode, formElement);
          if (!resolved) return false;
          const node = Array.isArray(resolved) ? resolved[0] : resolved;
          return Boolean(_isJsonNode(node) ? node.value : node);
        }

        // 3) ✅ Complex expressions containing lookup operator, e.g.
        //    contains(?title, instance('data')?ui?query)
        //
        // Important: XPath 3.1 lookup operator works on map(*) / array(*) items.
        // A JSON lens node is not a map(*) to the XPath engine.
        // So evaluate against the RAW JS value of the current JSON node.
        // Also enable jsonMode:'raw' so instance('data') returns raw JS root without recursion.
        const rawContext =
          typeof contextNode.getValue === 'function' ? contextNode.getValue() : contextNode.value;

        const variablesInScope = getVariablesInScope(formElement);

        return fxEvaluateXPathToBoolean(expr0, rawContext, null, variablesInScope, {
          currentContext: { formElement, jsonMode: 'raw' },
          functionNameResolver,
          moduleImports: { xf: XFORMS_NAMESPACE_URI },
          namespaceResolver: null,
          language: Language.XPATH_3_1_LANGUAGE,
          xmlSerializer: new XMLSerializer(),
        });
      }

      // 4) Non-lookup XPath in JSON context: evaluate via JSONDomFacade
      const variablesInScope = getVariablesInScope(formElement);
      return fxEvaluateXPathToBoolean(expr0, contextNode, __jsonDomFacade, variablesInScope, {
        currentContext: { formElement },
        functionNameResolver,
        moduleImports: { xf: XFORMS_NAMESPACE_URI },
        namespaceResolver: null,
        language: Language.XPATH_3_1_LANGUAGE,
        xmlSerializer: new XMLSerializer(),
      });
    }

    // ------------------------------------------------------------
    // XML / normal evaluation
    // ------------------------------------------------------------
    const namespaceResolver = createNamespaceResolverForNode(expr0, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    return fxEvaluateXPathToBoolean(expr0, contextNode, null, variablesInScope, {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: { xf: XFORMS_NAMESPACE_URI },
      namespaceResolver,
      language: Language.XPATH_3_1_LANGUAGE,
      xmlSerializer: new XMLSerializer(),
    });
  } catch (e) {
    formElement?.dispatchEvent?.(
      new CustomEvent('error', {
        composed: false,
        bubbles: true,
        detail: {
          origin: formElement,
          message: `Expression '${xpath}' failed: ${e}`,
          expr: xpath,
          level: 'Error',
        },
      }),
    );
    return false;
  }
}
export function evaluateXPathToString(xpath, contextNode, formElement, domFacade = null) {
  const expr0 = String(xpath ?? '').trim();

  const stringify = v => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (v?.nodeType) {
      if (v.nodeType === Node.ATTRIBUTE_NODE) return String(v.nodeValue ?? '');
      return String(v.textContent ?? '');
    }
    if (_isJsonNode(v)) {
      const vv = v.value;
      if (vv === null || vv === undefined) return '';
      if (typeof vv === 'string' || typeof vv === 'number' || typeof vv === 'boolean')
        return String(vv);
      try {
        return JSON.stringify(vv);
      } catch (_e) {
        return '';
      }
    }
    try {
      return JSON.stringify(v);
    } catch (_e) {
      return '';
    }
  };

  try {
    const idx = tryResolveIndexExpr(expr0, formElement);
    if (idx !== null) return String(idx);

    if (_isJsonNode(contextNode) && expr0 === '.') {
      return stringify(contextNode);
    }

    if (_isJsonNode(contextNode) && !_looksLikeLookupExpr(expr0)) {
      const variablesInScope = getVariablesInScope(formElement);
      const res = fxEvaluateXPathToString(expr0, contextNode, __jsonDomFacade, variablesInScope, {
        currentContext: { formElement },
        functionNameResolver,
        moduleImports: { xf: XFORMS_NAMESPACE_URI },
        namespaceResolver: null,
        language: Language.XPATH_3_1_LANGUAGE,
        xmlSerializer: new XMLSerializer(),
      });
      return stringify(res);
    }

    if (_looksLikeLookupExpr(expr0)) {
      const relativeJson = _isRelativeJsonLookup(expr0, contextNode);
      const instanceId = relativeJson ? null : _getInstanceIdForLookupExpr(expr0, formElement);
      const instance = relativeJson ? null : _getInstanceFromFormElement(formElement, instanceId);

      if (relativeJson || _isJsonInstance(instance)) {
        if (_isSimpleLookupExpr(expr0)) {
          const resolved = _resolveSimpleLookupToJsonNode(expr0, contextNode, formElement);
          if (!resolved) return '';
          const node = Array.isArray(resolved) ? resolved[0] : resolved;
          return stringify(node);
        }
        // for now, keep string conversions conservative
        return '';
      }
    }

    const namespaceResolver = createNamespaceResolverForNode(expr0, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    const res = fxEvaluateXPathToString(expr0, contextNode, domFacade, variablesInScope, {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: { xf: XFORMS_NAMESPACE_URI },
      namespaceResolver,
      language: Language.XPATH_3_1_LANGUAGE,
      xmlSerializer: new XMLSerializer(),
    });

    return stringify(res);
  } catch (e) {
    formElement?.dispatchEvent?.(
      new CustomEvent('error', {
        composed: false,
        bubbles: true,
        detail: {
          origin: formElement,
          message: `Expression '${xpath}' failed: ${e}`,
          expr: xpath,
          level: 'Error',
        },
      }),
    );
    return '';
  }
}

export function evaluateXPathToStrings(xpath, contextNode, formElement, domFacade = null) {
  const expr0 = String(xpath ?? '').trim();

  const stringify = v => {
    if (v === null || v === undefined) return '';
    if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean' ||
      typeof v === 'bigint'
    )
      return String(v);
    if (v?.nodeType) {
      if (v.nodeType === Node.ATTRIBUTE_NODE) return String(v.nodeValue ?? '');
      return String(v.textContent ?? '');
    }
    if (_isJsonNode(v)) return stringify(v.value);
    try {
      return JSON.stringify(v);
    } catch (_e) {
      return '';
    }
  };

  try {
    const idx = tryResolveIndexExpr(expr0, formElement);
    if (idx !== null) return [String(idx)];

    if (_isJsonNode(contextNode) && expr0 === '.') {
      return [stringify(contextNode)];
    }

    if (_isJsonNode(contextNode) && !_looksLikeLookupExpr(expr0)) {
      const res = fxEvaluateXPathToStrings(
        expr0,
        contextNode,
        __jsonDomFacade,
        getVariablesInScope(formElement),
        {
          currentContext: { formElement },
          functionNameResolver,
          moduleImports: { xf: XFORMS_NAMESPACE_URI },
          namespaceResolver: null,
          language: Language.XPATH_3_1_LANGUAGE,
          xmlSerializer: new XMLSerializer(),
        },
      );
      return Array.isArray(res) ? res.map(stringify) : [stringify(res)];
    }

    if (_looksLikeLookupExpr(expr0)) {
      const relativeJson = _isRelativeJsonLookup(expr0, contextNode);
      const instanceId = relativeJson ? null : _getInstanceIdForLookupExpr(expr0, formElement);
      const instance = relativeJson ? null : _getInstanceFromFormElement(formElement, instanceId);

      if (relativeJson || _isJsonInstance(instance)) {
        if (_isSimpleLookupExpr(expr0)) {
          const resolved = _resolveSimpleLookupToJsonNode(expr0, contextNode, formElement);
          if (!resolved) return [];
          const arr = Array.isArray(resolved) ? resolved : [resolved];
          return arr.map(stringify);
        }
        return [];
      }
    }

    const namespaceResolver = createNamespaceResolverForNode(expr0, contextNode, formElement);

    const res = fxEvaluateXPathToStrings(
      expr0,
      contextNode,
      domFacade,
      {},
      {
        currentContext: { formElement },
        functionNameResolver,
        moduleImports: { xf: XFORMS_NAMESPACE_URI },
        namespaceResolver,
        language: Language.XPATH_3_1_LANGUAGE,
        xmlSerializer: new XMLSerializer(),
      },
    );

    return Array.isArray(res) ? res.map(stringify) : [stringify(res)];
  } catch (e) {
    formElement?.dispatchEvent?.(
      new CustomEvent('error', {
        composed: false,
        bubbles: true,
        detail: {
          origin: formElement,
          message: `Expression '${xpath}' failed: ${e}`,
          expr: xpath,
          level: 'Error',
        },
      }),
    );
    return [];
  }
}

export function evaluateXPathToNumber(xpath, contextNode, formElement, domFacade = null) {
  const expr0 = String(xpath ?? '').trim();

  try {
    const idx = tryResolveIndexExpr(expr0, formElement);
    if (idx !== null) return idx;

    if (_isJsonNode(contextNode) && expr0 === '.') {
      const s = String(contextNode?.value ?? '');
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    }

    if (_isJsonNode(contextNode) && !_looksLikeLookupExpr(expr0)) {
      const variablesInScope = getVariablesInScope(formElement);
      return fxEvaluateXPathToNumber(expr0, contextNode, __jsonDomFacade, variablesInScope, {
        currentContext: { formElement },
        functionNameResolver,
        moduleImports: { xf: XFORMS_NAMESPACE_URI },
        namespaceResolver: null,
        language: Language.XPATH_3_1_LANGUAGE,
        xmlSerializer: new XMLSerializer(),
      });
    }

    if (_looksLikeLookupExpr(expr0)) {
      const relativeJson = _isRelativeJsonLookup(expr0, contextNode);
      const instanceId = relativeJson ? null : _getInstanceIdForLookupExpr(expr0, formElement);
      const instance = relativeJson ? null : _getInstanceFromFormElement(formElement, instanceId);

      if (relativeJson || _isJsonInstance(instance)) {
        // numbers for JSON are not a priority for now; keep conservative
        return NaN;
      }
    }

    const namespaceResolver = createNamespaceResolverForNode(expr0, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    return fxEvaluateXPathToNumber(expr0, contextNode, domFacade, variablesInScope, {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: { xf: XFORMS_NAMESPACE_URI },
      namespaceResolver,
      language: Language.XPATH_3_1_LANGUAGE,
      xmlSerializer: new XMLSerializer(),
    });
  } catch (e) {
    formElement?.dispatchEvent?.(
      new CustomEvent('error', {
        composed: false,
        bubbles: true,
        detail: {
          origin: formElement,
          message: `Expression '${xpath}' failed: ${e}`,
          expr: xpath,
          level: 'Error',
        },
      }),
    );
    return NaN;
  }
}

// ------------------------------------------------------------
// Custom functions (XForms/Fore)
// ------------------------------------------------------------

// context()
const contextFunction = (dynamicContext, string) => {
  const caller = dynamicContext.currentContext.formElement;
  let instanceEl = null;
  if (string) instanceEl = resolveId(string, caller);
  else instanceEl = XPathUtil.getParentBindingElement(caller);

  if (instanceEl) {
    if (instanceEl.nodeName === 'FX-REPEAT') {
      const { nodeset } = instanceEl;
      for (let parent = caller; parent; parent = parent.parentNode) {
        if (parent.parentNode === instanceEl) {
          const offset = Array.from(parent.parentNode.children).indexOf(parent);
          return nodeset[offset];
        }
      }
    }
    return instanceEl.nodeset;
  }

  return caller.getInScopeContext();
};

// current() - todo
const currentFunction = (_dynamicContext, _string) => null;

const elementFunction = (_dynamicContext, string) => document.createElement(string);

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'context' },
  [],
  'item()?',
  contextFunction,
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'context' },
  ['xs:string'],
  'item()?',
  contextFunction,
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'current' },
  ['xs:string'],
  'item()?',
  currentFunction,
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'element' },
  ['xs:string'],
  'item()?',
  elementFunction,
);

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'log' },
  ['xs:string?'],
  'xs:string?',
  (dynamicContext, string) => {
    const { formElement } = dynamicContext.currentContext;
    const instanceEl = resolveId(string, formElement, 'fx-instance');
    if (instanceEl) {
      if (instanceEl.getAttribute('type') === 'json') {
        console.warn('log() does not work for JSON yet');
        return JSON.stringify(instanceEl.getDefaultContext());
      }
      const def = new XMLSerializer().serializeToString(instanceEl.getDefaultContext());
      return prettifyXml(def);
    }
    return null;
  },
);

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'fore-attr' },
  ['xs:string?'],
  'xs:string?',
  (dynamicContext, string) => {
    const { formElement } = dynamicContext.currentContext;

    let parent = formElement;
    if (formElement.nodeType === Node.TEXT_NODE) parent = formElement.parentNode;

    const foreElement = parent.closest('fx-fore');
    if (foreElement.hasAttribute(string)) return foreElement.getAttribute(string);
    return null;
  },
);

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'parse' },
  ['xs:string?'],
  'element()?',
  (_dynamicContext, string) => {
    const parser = new DOMParser();
    const out = parser.parseFromString(string, 'application/xml');
    return out.firstElementChild;
  },
);

function buildTree(tree, data) {
  if (!data) return;
  if (data.nodeType !== Node.ELEMENT_NODE) return;

  const details = document.createElement('details');
  details.setAttribute('data-path', data.nodeName);
  const summary = document.createElement('summary');

  let display = ` <${data.nodeName}`;
  Array.from(data.attributes).forEach(attr => {
    display += ` ${attr.nodeName}="${attr.nodeValue}"`;
  });

  if (
    data.firstChild &&
    data.firstChild.nodeType === Node.TEXT_NODE &&
    data.firstChild.data.trim() !== ''
  ) {
    const contents = data.firstChild.nodeValue;
    display += `>${contents}</${data.nodeName}>`;
  } else {
    display += '>';
  }

  summary.textContent = display;
  details.appendChild(summary);

  if (data.childElementCount !== 0) {
    details.setAttribute('open', 'open');
    Array.from(data.children).forEach(child => buildTree(details, child));
  } else {
    summary.setAttribute('style', 'list-style:none;');
  }

  tree.appendChild(details);
}

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'logtree' },
  ['xs:string?'],
  'element()?',
  (dynamicContext, string) => {
    const { formElement } = dynamicContext.currentContext;
    const instanceEl = resolveId(string, formElement, 'fx-instance');
    if (!instanceEl) return null;

    const treeDiv = document.createElement('div');
    treeDiv.setAttribute('class', 'logtree');

    const form = dynamicContext.currentContext.formElement;
    const logtree = form.querySelector('.logtree');
    if (logtree) logtree.parentNode.removeChild(logtree);

    buildTree(treeDiv, instanceEl.getDefaultContext());
    form.appendChild(treeDiv);

    return null;
  },
);

// instance() — supports RAW JSON mode for predicates/filters
const instance = (dynamicContext, string) => {
  let caller = dynamicContext?.currentContext?.formElement || null;
  if (caller && caller.nodeType === Node.TEXT_NODE) caller = caller.parentNode;

  const fore =
    (caller && typeof caller.getOwnerForm === 'function' && caller.getOwnerForm()) ||
    _getOwningFore(caller) ||
    null;

  if (!fore) return null;

  const modelEl =
    (typeof fore.getModel === 'function' && fore.getModel()) ||
    fore.shadowRoot?.querySelector?.('fx-model') ||
    fore.querySelector?.('fx-model') ||
    null;

  if (!modelEl) return null;

  const id =
    string === null || string === undefined || String(string).trim() === ''
      ? 'default'
      : String(string);

  let instEl = typeof modelEl.getInstance === 'function' ? modelEl.getInstance(id) : null;

  if (!instEl) {
    if (id === 'default') {
      instEl =
        modelEl.querySelector?.('fx-instance:not([id])') ||
        modelEl.querySelector?.("fx-instance[id='default']") ||
        modelEl.querySelector?.('fx-instance') ||
        null;
    } else {
      instEl =
        resolveId(id, caller, 'fx-instance') ||
        modelEl.querySelector?.(`#${CSS.escape(id)}`) ||
        modelEl.querySelector?.(`fx-instance[id="${id}"]`) ||
        null;
    }
  }

  if (!instEl) return null;

  const type =
    (typeof instEl.getAttribute === 'function' && instEl.getAttribute('type')) || instEl.type || '';
  const isJson = type === 'json';

  // RAW JSON mode: return raw JS root (maps/arrays)
  if (dynamicContext?.currentContext?.jsonMode === 'raw' && isJson) {
    return _getRawJsonRootValue(instEl);
  }

  // Normal mode:
  if (isJson)
    return (
      instEl.nodeset ||
      (typeof instEl.getDefaultContext === 'function' ? instEl.getDefaultContext() : null) ||
      null
    );

  return (
    (typeof instEl.getDefaultContext === 'function' ? instEl.getDefaultContext() : null) ||
    instEl.nodeset ||
    null
  );
};

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'index' },
  ['xs:string?'],
  'xs:integer?',
  (dynamicContext, string) => {
    const { formElement } = dynamicContext.currentContext;

    if (string === null) return 1;
    const repeat = resolveId(string, formElement, 'fx-repeat');
    if (!repeat) return 1;

    const attr = repeat.getAttribute('index');
    const attrNum = Number(attr);
    if (Number.isFinite(attrNum) && attrNum > 0) return attrNum;

    const propNum = Number(repeat.index);
    if (Number.isFinite(propNum) && propNum > 0) return propNum;

    return 1;
  },
);

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'instance' },
  [],
  'item()?',
  dynamicContext => instance(dynamicContext, null),
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'instance' },
  ['xs:string?'],
  'item()?',
  instance,
);

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'depends' },
  ['node()*'],
  'item()?',
  (_dynamicContext, nodes) => nodes[0],
);

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'event' },
  ['xs:string?'],
  'item()?',
  (dynamicContext, arg) => {
    if (!arg) return null;

    for (
      let ancestor = dynamicContext.currentContext.formElement;
      ancestor;
      ancestor = ancestor.parentNode
    ) {
      if (!ancestor.currentEvent) continue;

      if (
        ancestor.currentEvent.detail &&
        typeof ancestor.currentEvent.detail === 'object' &&
        arg in ancestor.currentEvent.detail
      ) {
        return ancestor.currentEvent.detail[arg];
      }

      if (arg.includes('.')) return _propertyLookup(ancestor.currentEvent, arg);

      return ancestor.currentEvent[arg] || null;
    }

    return null;
  },
);

function _propertyLookup(obj, path) {
  const parts = path.split('.');
  if (parts.length === 1) return obj[parts[0]];
  return _propertyLookup(obj[parts[0]], parts.slice(1).join('.'));
}

registerXQueryModule(`
  module namespace xf="${XFORMS_NAMESPACE_URI}";

  declare %public function xf:boolean-from-string($str as xs:string) as xs:boolean {
      lower-case($str) = "true" or $str = "1"
  };
`);

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'base64encode' },
  ['xs:string?'],
  'xs:string?',
  (_dynamicContext, string) => btoa(string),
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'local-date' },
  [],
  'xs:string?',
  () => new Date().toLocaleDateString(),
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'local-dateTime' },
  [],
  'xs:string?',
  () => new Date().toLocaleString(),
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'uri' },
  [],
  'xs:string?',
  () => window.location.href,
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'uri-fragment' },
  [],
  'xs:string?',
  () => window.location.hash,
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'uri-host' },
  [],
  'xs:string?',
  () => window.location.host,
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'uri-query' },
  [],
  'xs:string?',
  () => window.location.search,
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'uri-relpath' },
  [],
  'xs:string?',
  () => {
    const path = new URL(window.location.href).pathname;
    return path.substring(0, path.lastIndexOf('/') + 1);
  },
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'uri-path' },
  [],
  'xs:string?',
  () => new URL(window.location.href).pathname,
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'uri-port' },
  [],
  'xs:string?',
  () => window.location.port,
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'uri-param' },
  ['xs:string?'],
  'xs:string?',
  (_dynamicContext, arg) => {
    if (!arg) return null;
    const urlparams = new URLSearchParams(window.location.search);
    return urlparams.get(arg) || '';
  },
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'uri-scheme' },
  [],
  'xs:string?',
  () => new URL(window.location.href).protocol,
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'uri-scheme-specific-part' },
  [],
  'xs:string?',
  () => {
    const uri = window.location.href;
    return uri.substring(uri.indexOf(':') + 1);
  },
);
