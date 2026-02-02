// xpath-evaluation.js
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

// ---------------------------
// JSON Lens + JSON/XPath mode
// ---------------------------
function _getOwningFore(node) {
  let n = node;
  if (!n) return null;

  if (n.nodeType === Node.ATTRIBUTE_NODE) n = n.ownerElement;
  if (n.nodeType === Node.TEXT_NODE) n = n.parentNode;

  // cross shadow
  if (n?.parentNode?.nodeType === Node.DOCUMENT_FRAGMENT_NODE) n = n.parentNode.host;

  return n?.closest ? n.closest('fx-fore') : null;
}

function _matchIndexExpr(expr) {
  const s = String(expr ?? '').trim();
  const m = s.match(/^index\s*\(\s*(['"])(.*?)\1\s*\)\s*$/);
  return m ? m[2] : null;
}

/**
 * Resolve index('repeatId') without evaluating XPath (prevents recursion).
 * Returns:
 *  - null  => not an index() expr
 *  - number => resolved index (defaults to 1)
 */
function tryResolveIndexExpr(expr, formElementOrNode) {
  try {
    const repeatId = _matchIndexExpr(expr);
    if (!repeatId) return null;

    // Resolve scoped repeat id first (handles repeats/shadow safely)
    const source = formElementOrNode?.nodeType
      ? formElementOrNode
      : _getOwningFore(formElementOrNode);
    const repeat =
      (source && resolveId(repeatId, source, 'fx-repeat')) ||
      _getOwningFore(source)?.querySelector?.(`#${CSS.escape(repeatId)}`);

    if (!repeat) return 1;

    // Prefer attribute if present
    const attr = repeat.getAttribute('index') ?? repeat.getAttribute('repeat-index');
    let idx = Number(attr);

    // fallback to property or method
    if (!Number.isFinite(idx) || idx < 1) {
      if (typeof repeat.getIndex === 'function') idx = Number(repeat.getIndex());
      else idx = Number(repeat.index);
    }

    return Number.isFinite(idx) && idx >= 1 ? idx : 1;
  } catch (_e) {
    // absolutely never throw from this helper
    return null;
  }
}

function isXmlDomContext(node) {
  // HTML / XML DOM nodes have nodeType. JSON lens nodes do not.
  return !!node?.nodeType && !node?.__jsonlens__;
}

function isJsonLookupExpr(xpath) {
  if (typeof xpath !== 'string') return false;
  const t = xpath.trim();

  // Lens shorthand: "?a?b" or ".?a?b"
  if (t.startsWith('?') || t.startsWith('.?')) return true;

  // Only treat instance(...) as lens if it is followed by a "?" step
  // (instance('x') alone is normal XPath, not lens lookup)
  // instance()?a  (default instance root + lens lookup)
  if (/^instance\s*\(\s*\)\s*\?/.test(t)) return true;

  // instance('x')?a  (explicit instance id + lens lookup)
  return /^instance\s*\(\s*(['"]).*?\1\s*\)\s*\?/.test(t);
}

function shouldUseJson(xpath, contextNode, formElement) {
  // Never treat actual DOM nodes (HTML/XML) as JSON context
  if (isXmlDomContext(contextNode)) return false;

  // Lens nodes are always JSON
  if (contextNode?.__jsonlens__) return true;

  // If it's not lens syntax, don't switch to JSON
  if (!isJsonLookupExpr(xpath)) return false;

  // Now decide by instance type
  const instanceId = XPathUtil.getInstanceId(String(xpath), formElement);
  const instance = formElement?.getModel?.()?.getInstance?.(instanceId);
  return instance?.type === 'json';
}
function getJsonFacade(formElement, xpath, contextNode, domFacade = null) {
  const instanceId = XPathUtil.getInstanceId(xpath, formElement);
  const instance = formElement?.getModel?.()?.getInstance?.(instanceId);

  // Only ever return JSON facade if:
  // - the target instance is json
  // - AND the expression/context say "this is JSON evaluation"
  if (instance?.type !== 'json') return domFacade;
  if (!shouldUseJson(xpath, contextNode, formElement)) return domFacade;

  if (!instance.domFacade) instance.domFacade = new JSONDomFacade();
  return domFacade || instance.domFacade;
}

function normalizeUnaryLookup(xpath, isJson) {
  const expr = String(xpath ?? '');
  const t = expr.trim();
  // Lens shorthand: “?a?b” should behave like “.?a?b” in XQuery.
  if (isJson && t.startsWith('?')) return `.${t}`;
  return expr;
}

// ---- JSON Lens resolver (direct traversal of JSONNode tree) ----

function _parseJsonLensRef(ref, defaultInstanceId = 'default') {
  if (!ref) return null;
  const s = String(ref).trim();

  // Shorthand "?a?b" or ".?a?b" -> default instance
  if (s.startsWith('?') || s.startsWith('.?')) {
    const lensPart = s.startsWith('.?') ? s.slice(1) : s; // strip leading "."
    const steps = lensPart
      .split('?')
      .filter(Boolean)
      .map(part => {
        if (part === '*') return '*';
        if (/^\d+$/.test(part)) return Number(part) - 1; // 1-based -> 0-based
        return part;
      });

    return { instanceId: defaultInstanceId, steps, hasExplicitInstance: false };
  }
  // instance()?a?b -> default instance (explicit root)
  const instNoArg = s.match(/^instance\s*\(\s*\)\s*(\?.+)$/);
  if (instNoArg) {
    const lensPart = instNoArg[1];
    const steps = lensPart
      .split('?')
      .filter(Boolean)
      .map(part => {
        if (part === '*') return '*';
        if (/^\d+$/.test(part)) return Number(part) - 1;
        return part;
      });

    return { instanceId: defaultInstanceId, steps, hasExplicitInstance: true };
  }
  // instance('x')?a?b  (ONLY lens syntax; reject instance('x') alone)
  const instMatch = s.match(/^instance\s*\(\s*(['"])(.*?)\1\s*\)\s*(\?.+)$/);
  if (!instMatch) return null;

  const instanceId = instMatch[2];
  const lensPart = instMatch[3];

  const steps = lensPart
    .split('?')
    .filter(Boolean)
    .map(part => {
      if (part === '*') return '*';
      if (/^\d+$/.test(part)) return Number(part) - 1;
      return part;
    });

  return { instanceId, steps, hasExplicitInstance: true };
}
function _findNearestJsonContextNode(formElement) {
  // IMPORTANT: must NOT call getModelItem() or getInScopeContext() here.
  // We only inspect already-attached fields to avoid recursion.

  for (let n = formElement; n; ) {
    // Prefer an already bound nodeset on UI elements / repeatitems
    const ns = n.nodeset;
    if (ns?.__jsonlens__) return ns;

    // If the element already has a modelItem assigned, inspect it without computing anything
    const mi = n.modelItem;
    if (mi?.node?.__jsonlens__) return mi.node;

    // Cross shadow boundaries
    if (n.parentNode?.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      n = n.parentNode.host;
    } else {
      n = n.parentNode;
    }
  }
  return null;
}

function _resolveJsonLens(xpath, contextNode, formElement) {
  if (typeof xpath !== 'string') return null;
  const t = xpath.trim();
  if (!isJsonLookupExpr(t)) return null;

  const parsed = _parseJsonLensRef(t, 'default');
  if (!parsed) return null;

  const model = formElement?.getModel?.();
  const instance = model?.getInstance?.(parsed.instanceId);
  if (!instance || instance.type !== 'json') return null;

  const root = instance.nodeset;
  if (!root || !root.__jsonlens__) return null;

  let node = root;
  if (!parsed.hasExplicitInstance) {
    if (contextNode?.__jsonlens__) node = contextNode;
    else {
      const scoped = _findNearestJsonContextNode(formElement);
      if (scoped) node = scoped;
    }
  }

  for (const step of parsed.steps) {
    if (step === '*') return node?.children || [];

    // Support JSON-lens array selection using XPath-ish bracket syntax in a step:
    //   ?items[2]?name
    //   ?items[index('items')]?name
    // where the bracket content is 1-based.
    if (typeof step === 'string') {
      const m = step.match(/^([^\[]+)\[(.+)\]$/);
      if (m) {
        const key = m[1].trim();
        const pred = m[2].trim();

        // first hop: object property (typically the array container)
        node = node?.get?.(key);
        if (!node) return null;

        // resolve bracket => 1-based index
        let idx1 = null;

        if (/^\d+$/.test(pred)) {
          idx1 = Number(pred);
        } else {
          const resolved = tryResolveIndexExpr(pred, formElement);
          if (resolved !== null) idx1 = Number(resolved);
        }

        if (!Number.isFinite(idx1) || idx1 < 1) return null;

        const idx0 = idx1 - 1;

        // second hop: array member
        node = node?.get?.(idx0);
        if (!node) return null;

        continue;
      }
    }

    // normal lens step (object key or 0-based array index already parsed as number)
    node = node?.get?.(step);
    if (!node) return null;
  }

  return node;
}

// For nodeset consumers (fx-repeat, fx-items): if the final node is an array, iterate its children.
function _resolveJsonLensToNodes(xpath, contextNode, formElement) {
  const node = _resolveJsonLens(xpath, contextNode, formElement);
  if (!node) return null;

  if (Array.isArray(node)) return node; // already a list (eg ?*)
  if (Array.isArray(node.value)) return node.children || [];
  return [node];
}

// A global registry of function names that are declared in Fore by a developer using the
// `fx-function` element. These should be available without providing a prefix as well
export const globallyDeclaredFunctionLocalNames = [];

function getCachedNamespaceResolver(xpath, node) {
  if (!createdNamespaceResolversByXPathQueryAndNode.has(xpath)) {
    return null;
  }
  return createdNamespaceResolversByXPathQueryAndNode.get(xpath).get(node) || null;
}

function setCachedNamespaceResolver(xpath, node, resolver) {
  if (!createdNamespaceResolversByXPathQueryAndNode.has(xpath)) {
    createdNamespaceResolversByXPathQueryAndNode.set(xpath, new Map());
  }
  createdNamespaceResolversByXPathQueryAndNode.get(xpath).set(node, resolver);
}

const xhtmlNamespaceResolver = prefix => {
  if (!prefix) return 'http://www.w3.org/1999/xhtml';
  return undefined;
};

export function isInShadow(node) {
  return node.getRootNode() instanceof ShadowRoot;
}

/**
 * Resolve an id in scope. Behaves like the algorithm defined on
 * https://www.w3.org/community/xformsusers/wiki/XForms_2.0#idref-resolve
 */
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

// Namespace resolving infra
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

export function createNamespaceResolver(xpathQuery, formElement) {
  const cachedResolver = getCachedNamespaceResolver(xpathQuery, formElement);
  if (cachedResolver) return cachedResolver;

  // IMPORTANT: Break potential recursion by caching a provisional resolver immediately.
  // If createNamespaceResolver is re-entered for the same (query, node) while computing, it will return this.
  const provisionalResolver = prefix => (prefix ? undefined : '');
  setCachedNamespaceResolver(xpathQuery, formElement, provisionalResolver);

  let instanceReferences = findInstanceReferences(xpathQuery);

  // Helper: find a *parent* [ref] element, excluding self, across shadow boundaries.
  const closestRefExcludingSelf = el => {
    if (!el) return null;

    let n = el;
    if (n.nodeType === Node.ATTRIBUTE_NODE) n = n.ownerElement;
    if (n?.parentNode?.nodeType === Node.DOCUMENT_FRAGMENT_NODE) n = n.parentNode.host;

    // Start at parent (or parent host) to avoid returning self
    let start = n?.parentNode;
    if (start?.nodeType === Node.DOCUMENT_FRAGMENT_NODE) start = start.host;

    return start?.closest ? start.closest('[ref]') : null;
  };

  if (instanceReferences.length === 0) {
    const ancestorComponent = closestRefExcludingSelf(formElement);

    // Only inherit if we found an actual parent ref-holder and it's not a self-loop
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

// eslint-disable-next-line no-unused-vars
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

function getVariablesInScope(formElement) {
  let closestActualFormElement = formElement;
  while (closestActualFormElement && !('inScopeVariables' in closestActualFormElement)) {
    closestActualFormElement =
      closestActualFormElement.nodeType === Node.ATTRIBUTE_NODE
        ? closestActualFormElement.ownerElement
        : closestActualFormElement.parentNode;
  }

  if (!closestActualFormElement) {
    return {};
  }

  const variables = {};
  if (closestActualFormElement.inScopeVariables) {
    for (const key of closestActualFormElement.inScopeVariables.keys()) {
      const varElementOrValue = closestActualFormElement.inScopeVariables.get(key);
      if (!varElementOrValue) {
        continue;
      }
      if (varElementOrValue.nodeType) {
        variables[key] = varElementOrValue.value;
      } else {
        variables[key] = varElementOrValue;
      }
    }
  }
  return variables;
}

// ---------------------------
// Exported evaluation helpers
// ---------------------------

export function evaluateXPath(
  xpath,
  contextNode,
  formElement,
  variables = {},
  options = {},
  domFacade = null,
) {
  const trimmedExpr = String(xpath ?? '').trim();

  try {
    // Fast path for index('repeatId')
    const idx = tryResolveIndexExpr(trimmedExpr, formElement);
    if (idx !== null) return [idx];

    if (contextNode && contextNode.__jsonlens__ === true && trimmedExpr === '.') {
      return [contextNode];
    }

    const lensNodes = _resolveJsonLensToNodes(xpath, contextNode, formElement);
    if (lensNodes) return lensNodes;

    // If it *looks* like lens syntax but we couldn't resolve it (e.g. JSON instance not loaded yet),
    // do NOT fall back to FontoXPath (can recurse with JSONDomFacade). Just return empty.
    if (isJsonLookupExpr(trimmedExpr)) return [];

    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    const effectiveFacade = getJsonFacade(formElement, xpath, contextNode, domFacade);
    const isJson = !!effectiveFacade && shouldUseJson(xpath, contextNode, formElement); // ✅ FIX
    const expr = normalizeUnaryLookup(xpath, isJson);

    const instanceId = XPathUtil.getInstanceId(expr, formElement);
    const instance = formElement?.getModel?.()?.getInstance?.(instanceId);
    const effectiveContext = isJson && !contextNode?.__jsonlens__ ? instance?.nodeset : contextNode;

    return fxEvaluateXPath(
      expr,
      effectiveContext,
      effectiveFacade,
      { ...variablesInScope, ...variables },
      fxEvaluateXPath.ALL_RESULTS_TYPE,
      {
        debug: true,
        currentContext: { formElement, variables },
        moduleImports: { xf: XFORMS_NAMESPACE_URI },
        functionNameResolver,
        namespaceResolver,
        language: Language.XPATH_3_1_LANGUAGE, // ✅ keep consistent; JSON lens is XPath 3.1
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
  const trimmedExpr = String(xpath ?? '').trim();
  try {
    if (contextNode && contextNode.__jsonlens__ === true && trimmedExpr === '.') {
      return contextNode;
    }

    const lens = _resolveJsonLens(xpath, contextNode, formElement);
    if (lens) return Array.isArray(lens) ? lens[0] || null : lens;

    if (isJsonLookupExpr(trimmedExpr)) return null;

    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    const domFacade = getJsonFacade(formElement, xpath, contextNode, null);
    const isJson = !!domFacade && shouldUseJson(xpath, contextNode, formElement); // ✅ FIX
    const expr = normalizeUnaryLookup(xpath, isJson);

    const instanceId = XPathUtil.getInstanceId(expr, formElement);
    const instance = formElement?.getModel?.()?.getInstance?.(instanceId);
    const effectiveContext = isJson && !contextNode?.__jsonlens__ ? instance?.nodeset : contextNode;

    return fxEvaluateXPathToFirstNode(expr, effectiveContext, domFacade, variablesInScope, {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: { xf: XFORMS_NAMESPACE_URI },
      namespaceResolver,
      language: Language.XPATH_3_1_LANGUAGE, // ✅ FIX (don’t switch JSON to XQuery)
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
  const trimmedExpr = String(xpath ?? '').trim();
  try {
    if (contextNode && contextNode.__jsonlens__ === true && trimmedExpr === '.') {
      return [contextNode];
    }

    const lensNodes = _resolveJsonLensToNodes(xpath, contextNode, formElement);
    if (lensNodes) return lensNodes;

    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    const domFacade = getJsonFacade(formElement, xpath, contextNode, null);
    const isJson = !!domFacade && shouldUseJson(xpath, contextNode, formElement); // ✅ FIX
    const expr = normalizeUnaryLookup(xpath, isJson);

    const instanceId = XPathUtil.getInstanceId(expr, formElement);
    const instance = formElement?.getModel?.()?.getInstance?.(instanceId);
    const effectiveContext = isJson && !contextNode?.__jsonlens__ ? instance?.nodeset : contextNode;

    return fxEvaluateXPathToNodes(expr, effectiveContext, domFacade, variablesInScope, {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: { xf: XFORMS_NAMESPACE_URI },
      namespaceResolver,
      language: Language.XPATH_3_1_LANGUAGE, // ✅ FIX
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
  const s = String(xpath ?? '').trim();

  try {
    const idx = tryResolveIndexExpr(s, formElement);
    if (idx !== null) return Boolean(idx);

    const lens = _resolveJsonLens(xpath, contextNode, formElement);
    if (lens) {
      const n = Array.isArray(lens) ? lens[0] : lens;
      if (!n) return false;
      try {
        return Boolean(n.get ? n.get() : n.value);
      } catch (_e) {
        return true;
      }
    }

    const namespaceResolver = createNamespaceResolverForNode(s, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    const domFacade = getJsonFacade(formElement, s, contextNode, null);
    const isJson = !!domFacade && shouldUseJson(s, contextNode, formElement); // ✅ FIX
    const expr = normalizeUnaryLookup(s, isJson);

    const instanceId = XPathUtil.getInstanceId(expr, formElement);
    const instance = formElement?.getModel?.()?.getInstance?.(instanceId);
    const effectiveContext = isJson && !contextNode?.__jsonlens__ ? instance?.nodeset : contextNode;

    return fxEvaluateXPathToBoolean(expr, effectiveContext, domFacade, variablesInScope, {
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
  const s = String(xpath ?? '').trim();

  // Lens detection MUST NOT rely solely on __jsonlens__ (some lens nodes may miss the flag)
  const isLensLike = v =>
    !!v &&
    typeof v === 'object' &&
    (v.__jsonlens__ === true ||
      (typeof v.get === 'function' &&
        (typeof v.set === 'function' || 'value' in v || 'children' in v)));

  const unwrapLens = v => {
    if (!isLensLike(v)) return v;
    try {
      // Most lens nodes expose atomic via get()
      const got = v.get.length === 0 ? v.get() : v.get();
      return got;
    } catch (_e) {
      // fallback to .value if present
      return 'value' in v ? v.value : v;
    }
  };

  const stringify = v => {
    if (v === null || v === undefined) return '';

    // unwrap lens nodes (or values that are lens nodes)
    const unwrapped = unwrapLens(v);

    if (unwrapped === null || unwrapped === undefined) return '';
    if (
      typeof unwrapped === 'string' ||
      typeof unwrapped === 'number' ||
      typeof unwrapped === 'boolean'
    ) {
      return String(unwrapped);
    }

    // DOM nodes → text
    if (unwrapped?.nodeType) {
      if (unwrapped.nodeType === Node.ATTRIBUTE_NODE) return String(unwrapped.nodeValue ?? '');
      return String(unwrapped.textContent ?? '');
    }

    // If it is still lens-like (object node), try one more unwrap
    if (isLensLike(unwrapped)) {
      return stringify(unwrapLens(unwrapped));
    }

    // generic object: never return "[object Object]"
    try {
      return JSON.stringify(unwrapped);
    } catch (_e) {
      return '';
    }
  };

  try {
    // Fast path for index('repeatId')
    const idx = tryResolveIndexExpr(s, formElement);
    if (idx !== null) return String(idx);

    // "." on a lens node should resolve to its atomic value (not object)
    if (isLensLike(contextNode) && s === '.') {
      return stringify(contextNode);
    }

    // Convenience: allow simple property access on JSON lens nodes (e.g. "value")
    // in addition to lens lookup syntax (e.g. "?value").
    if (isLensLike(contextNode) && !isJsonLookupExpr(s)) {
      try {
        const value = contextNode.get?.(s);
        if (value !== undefined) {
          return stringify(value);
        }
      } catch (_e) {
        // fall through to XPath evaluation
      }
    }

    const lens = _resolveJsonLens(xpath, contextNode, formElement);
    if (lens) {
      if (Array.isArray(lens)) return lens.length ? stringify(lens[0]) : '';
      return stringify(lens);
    }

    const namespaceResolver = createNamespaceResolverForNode(s, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    const effectiveFacade = getJsonFacade(formElement, s, contextNode, domFacade);
    const isJson = !!effectiveFacade && shouldUseJson(s, contextNode, formElement);
    const expr = normalizeUnaryLookup(s, isJson);

    const instanceId = XPathUtil.getInstanceId(expr, formElement);
    const instance = formElement?.getModel?.()?.getInstance?.(instanceId);
    const effectiveContext = isJson && !isLensLike(contextNode) ? instance?.nodeset : contextNode;

    const result = fxEvaluateXPathToString(
      expr,
      effectiveContext,
      effectiveFacade,
      variablesInScope,
      {
        currentContext: { formElement },
        functionNameResolver,
        moduleImports: { xf: XFORMS_NAMESPACE_URI },
        namespaceResolver,
        language: isJson ? Language.XPATH_3_1_LANGUAGE : Language.XPATH_3_1_LANGUAGE,
        xmlSerializer: new XMLSerializer(),
      },
    );

    // IMPORTANT: fontoxpath may return objects for JSON; normalize here
    return stringify(result);
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
  const s = String(xpath ?? '').trim();

  try {
    const idx = tryResolveIndexExpr(s, formElement);
    if (idx !== null) return [String(idx)];

    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);

    const effectiveFacade = getJsonFacade(formElement, xpath, contextNode, domFacade);
    const isJson = !!effectiveFacade && shouldUseJson(xpath, contextNode, formElement); // ✅ FIX
    const expr = normalizeUnaryLookup(xpath, isJson);

    const instanceId = XPathUtil.getInstanceId(expr, formElement);
    const instance = formElement?.getModel?.()?.getInstance?.(instanceId);
    const effectiveContext = isJson && !contextNode?.__jsonlens__ ? instance?.nodeset : contextNode;

    return fxEvaluateXPathToStrings(
      expr,
      effectiveContext,
      effectiveFacade,
      {},
      {
        currentContext: { formElement },
        functionNameResolver,
        moduleImports: { xf: XFORMS_NAMESPACE_URI },
        namespaceResolver,
        language: Language.XPATH_3_1_LANGUAGE, // ✅ FIX
        xmlSerializer: new XMLSerializer(),
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
export function evaluateXPathToNumber(xpath, contextNode, formElement, domFacade = null) {
  const s = String(xpath ?? '').trim();

  try {
    const idx = tryResolveIndexExpr(s, formElement);
    if (idx !== null) return idx;

    const namespaceResolver = createNamespaceResolverForNode(s, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    const effectiveFacade = getJsonFacade(formElement, s, contextNode, domFacade);
    const isJson = !!effectiveFacade && shouldUseJson(s, contextNode, formElement); // ✅ FIX
    const expr = normalizeUnaryLookup(s, isJson);

    const instanceId = XPathUtil.getInstanceId(expr, formElement);
    const instance = formElement?.getModel?.()?.getInstance?.(instanceId);
    const effectiveContext = isJson && !contextNode?.__jsonlens__ ? instance?.nodeset : contextNode;

    return fxEvaluateXPathToNumber(expr, effectiveContext, effectiveFacade, variablesInScope, {
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
// ---------------------------
// Function registrations
// ---------------------------

const contextFunction = (dynamicContext, string) => {
  const caller = dynamicContext.currentContext.formElement;
  let instance = null;
  if (string) {
    instance = resolveId(string, caller);
  } else {
    instance = XPathUtil.getParentBindingElement(caller);
  }
  if (instance) {
    if (instance.nodeName === 'FX-REPEAT') {
      const { nodeset } = instance;
      for (let parent = caller; parent; parent = parent.parentNode) {
        if (parent.parentNode === instance) {
          const offset = Array.from(parent.parentNode.children).indexOf(parent);
          return nodeset[offset];
        }
      }
    }
    return instance.nodeset;
  }

  return caller.getInScopeContext();
};

// todo: implement
const currentFunction = (dynamicContext, string) => {
  const caller = dynamicContext.currentContext.formElement;
  return null;
};

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
    const instance = resolveId(string, formElement, 'fx-instance');
    if (instance) {
      if (instance.getAttribute('type') === 'json') {
        console.warn('log() does not work for JSON yet');
        return JSON.stringify(instance.getDefaultContext());
      }
      const def = new XMLSerializer().serializeToString(instance.getDefaultContext());
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

const instance = (dynamicContext, string) => {
  const caller = dynamicContext.currentContext.formElement;

  // Prefer Fore’s built-in owner resolution when present
  const fore =
    (caller && typeof caller.getOwnerForm === 'function' && caller.getOwnerForm()) ||
    _getOwningFore(caller);

  if (!fore) return null;

  const modelEl = fore.querySelector('fx-model');
  if (!modelEl) return null;

  let instEl = null;

  if (string === null || string === 'default') {
    // Fore default instance is the first fx-instance in the model (regardless of @id)
    instEl = modelEl.querySelector('fx-instance');
  } else {
    // scoped resolution first; fallback to model-local lookup
    instEl =
      resolveId(string, caller, 'fx-instance') ||
      modelEl.querySelector(`#${CSS.escape(string)}`) ||
      modelEl.querySelector(`fx-instance[id="${string}"]`);

    if (!instEl) {
      fore.dispatchEvent(
        new CustomEvent('error', {
          composed: true,
          bubbles: true,
          detail: {
            origin: 'functions',
            message: `Instance not found '${string}'`,
            level: 'Error',
          },
        }),
      );
      return null;
    }
  }

  // IMPORTANT: return a DOM node for XML instances, JSON nodeset for JSON instances
  const isJson = instEl.getAttribute('type') === 'json';

  if (isJson) {
    // JSON: Fore stores the JSON root on .nodeset (JSON lens node)
    return (
      instEl.nodeset ||
      (typeof instEl.getDefaultContext === 'function' ? instEl.getDefaultContext() : null)
    );
  }

  // XML: always return the XML default context (DOM node)
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

    // XForms default: if no argument → 1
    if (string === null) return 1;
    const repeat = resolveId(string, formElement, 'fx-repeat');
    if (!repeat) return 1;

    // Prefer attribute (because that's what Fore sets / persists)
    const attr = repeat.getAttribute('index');
    const attrNum = Number(attr);
    if (Number.isFinite(attrNum) && attrNum > 0) return attrNum;

    // Fallback: some components expose .index as a property
    const propNum = Number(repeat.index);
    if (Number.isFinite(propNum) && propNum > 0) return propNum;

    // Final fallback: XForms default
    return 1;
  },
);

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'instance' },
  [],
  'item()?',
  domFacade => instance(domFacade, null),
);
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'instance' },
  ['xs:string?'],
  'item()?',
  instance,
);

const jsonToXml = (_dynamicContext, json) => {
  const escapeXml = str =>
    String(str).replace(
      /[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g,
      char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`,
    );

  const convert = (obj, parent) => {
    const type = typeof obj;
    if (type === 'number') {
      parent.setAttribute('type', 'number');
      parent.textContent = obj.toString();
    } else if (type === 'boolean') {
      parent.setAttribute('type', 'boolean');
      parent.textContent = obj.toString();
    } else if (obj === null) {
      const node = document.createElement('_');
      node.setAttribute('type', 'null');
      parent.appendChild(node);
    } else if (type === 'string') {
      parent.textContent = escapeXml(obj);
    } else if (Array.isArray(obj)) {
      parent.setAttribute('type', 'array');
      obj.forEach(item => {
        const node = document.createElement('_');
        convert(item, node);
        node.textContent = String(item);
        parent.appendChild(node);
      });
    } else if (type === 'object' && obj) {
      parent.setAttribute('type', 'object');
      Object.entries(obj).forEach(([key, value]) => {
        const childNode = document.createElement(String(key).replace(/[^a-zA-Z0-9_]/g, '_'));
        convert(value, childNode);
        parent.appendChild(childNode);
      });
    }
  };

  const root = document.createElement('json');
  root.setAttribute('type', Array.isArray(json) ? 'array' : 'object');
  convert(json, root);
  return root;
};

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'json2xml' },
  ['item()?'],
  'item()?',
  jsonToXml,
);

const xmlToJson = (_dynamicContext, xml) => {
  const isElementNode = node => node.nodeType === Node.ELEMENT_NODE;
  const isTextNode = node => node.nodeType === Node.TEXT_NODE;

  const parseNode = node => {
    if (isElementNode(node)) {
      const obj = {};
      if (node.hasAttributes()) obj.type = node.getAttribute('type');
      if (node.childNodes.length === 1 && isTextNode(node.firstChild)) {
        return node.textContent;
      }
      for (const child of node.childNodes) {
        const childName = child.nodeName;
        const childValue = parseNode(child);
        if (obj[childName]) {
          if (!Array.isArray(obj[childName])) obj[childName] = [obj[childName]];
          obj[childName].push(childValue);
        } else {
          obj[childName] = childValue;
        }
      }
      return obj;
    }
    if (isTextNode(node)) return node.textContent;
    return undefined;
  };

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'application/xml');
  return parseNode(xmlDoc.documentElement);
};

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'xmltoJson' },
  ['item()?'],
  'item()?',
  xmlToJson,
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

      if (arg.includes('.')) {
        return _propertyLookup(ancestor.currentEvent, arg);
      }

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
