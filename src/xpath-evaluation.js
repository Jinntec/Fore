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

function isXmlDomContext(node) {
  // HTML / XML DOM nodes have nodeType. JSON lens nodes do not.
  return !!node?.nodeType && !node?.__jsonlens__;
}

function isJsonLookupExpr(xpath) {
  if (typeof xpath !== 'string') return false;
  const t = xpath.trim();
  // “?a?b” or “instance('x')?a?b”
  return t.startsWith('?') || /^instance\s*\(/.test(t);
}

function shouldUseJson(xpath, contextNode) {
  // If we’re evaluating on the Fore/HTML/XML DOM, NEVER treat it as JSON.
  if (isXmlDomContext(contextNode)) return false;

  // JSON mode only when actually evaluating JSON lens nodes or lens lookup syntax.
  return !!contextNode?.__jsonlens__ || isJsonLookupExpr(xpath);
}

function getJsonFacade(formElement, xpath, contextNode, domFacade = null) {
  const instanceId = XPathUtil.getInstanceId(xpath, formElement);
  const instance = formElement?.getModel?.()?.getInstance?.(instanceId);

  // Non-JSON instance: keep the passed facade (usually null, sometimes a tracking facade).
  if (instance?.type !== 'json') return domFacade;

  // JSON instance, but this evaluation is for the XML/HTML DOM (template scan etc.) → don’t switch.
  if (!shouldUseJson(xpath, contextNode)) return domFacade;

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

  const instMatch = s.match(/^instance\s*\(\s*(['"])(.*?)\1\s*\)\s*(\?.*)?$/);
  let instanceId;
  let lensPart;

  if (instMatch) {
    instanceId = instMatch[2];
    lensPart = instMatch[3] || '';
  } else {
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

  return { instanceId, steps, hasExplicitInstance: !!instMatch };
}

function _findNearestJsonContextNode(formElement) {
  // IMPORTANT: Do NOT call formElement.getInScopeContext() here.
  // That often evaluates XPath internally and can recurse back into evaluateXPath → stack overflow.
  for (let n = formElement; n; n = n.parentNode) {
    if (typeof n?.getModelItem === 'function') {
      const mi = n.getModelItem();
      if (mi?.node?.__jsonlens__) return mi.node;
    }
  }
  return null;
}

function _resolveJsonLens(xpath, contextNode, formElement) {
  if (typeof xpath !== 'string') return null;
  const t = xpath.trim();
  if (!(t.startsWith('?') || t.startsWith('instance('))) return null;

  const parsed = _parseJsonLensRef(t, 'default');
  if (!parsed) return null;

  const model = formElement?.getModel?.();
  const instance = model?.getInstance?.(parsed.instanceId) || model?.getInstance?.('default');

  const root = instance?.nodeset;
  if (!root || !root.__jsonlens__) return null;

  // Base node:
  // - explicit instance('x') → start at root
  // - otherwise: prefer JSON contextNode, else nearest modelItem JSON node, else root
  let node = root;
  if (!parsed.hasExplicitInstance) {
    if (contextNode?.__jsonlens__) {
      node = contextNode;
    } else {
      const scoped = _findNearestJsonContextNode(formElement);
      if (scoped) node = scoped;
    }
  }

  for (const step of parsed.steps) {
    if (step === '*') return node?.children || [];
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

function resolveJsonLens(xpath, contextNode, formElement) {
  if (typeof xpath !== 'string') return null;

  const trimmed = xpath.trim();
  // lens refs: "?a?b" or "instance('x')?a?b"
  if (!(trimmed.startsWith('?') || trimmed.startsWith('instance('))) return null;

  const parsed = parseJsonRef(trimmed, 'default');
  if (!parsed) return null;

  // If ref explicitly targets an instance, use that root; otherwise, prefer JSON contextNode.
  let startNode = null;

  if (trimmed.startsWith('instance(')) {
    const inst = formElement?.getModel?.()?.getInstance?.(parsed.instanceId);
    startNode = inst?.nodeset || null; // FxInstance sets this for JSON
  } else if (contextNode?.__jsonlens__) {
    startNode = contextNode;
  } else {
    const inst = formElement?.getModel?.()?.getInstance?.(parsed.instanceId);
    startNode = inst?.nodeset || null;
  }

  if (!startNode || !startNode.__jsonlens__) return null;

  // Walk steps on the EXISTING JSONNode tree so parent/keyOrIndex stay intact
  let node = startNode;

  for (const step of parsed.steps) {
    if (step === '*') {
      return node.children || [];
    }
    node = node?.get(step);
    if (!node) return null;
  }

  return node;
}

/**
 * Resolve an id in scope. Behaves like the algorithm defined on https://www.w3.org/community/xformsusers/wiki/XForms_2.0#idref-resolve
 *
 * @param {string} id
 * @param {Node} sourceObject
 * @param {string} nodeName
 *
 * @returns {HTMLElement} The element with that ID, resolved with respect to repeats
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
  if (sourceObject.parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    sourceObject = sourceObject.parentNode.host;
  }
  const ownerForm =
    sourceObject.localName === 'fx-fore' ? sourceObject : sourceObject.closest('fx-fore');
  const elementsWithId = ownerForm.querySelectorAll(`[id='${id}']`);
  if (elementsWithId.length === 1) {
    // A single one is found. Assume no ID reuse.
    const targetObject = elementsWithId[0];
    if (nodeName && targetObject.localName !== nodeName) {
      return null;
    }
    return targetObject;
  }

  const allMatchingTargetObjects = fxEvaluateXPathToNodes(
    query,
    sourceObject,
    null,
    { id },
    { namespaceResolver: xhtmlNamespaceResolver },
  );

  if (allMatchingTargetObjects.length === 0) {
    return null;
  }

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
    // If the target element is not repeated, then the search for the target object is trivial since
    // there is only one associated with the target element that bears the matching ID. This is true
    // regardless of whether or not the source object is repeated. However, if the target element is
    // repeated, then additional information must be used to help select a target object from among
    // those associated with the identified target element.
    const targetObject = allMatchingTargetObjects[0];
    if (nodeName && targetObject.localName !== nodeName) {
      return null;
    }
    return targetObject;
  }

  // SPEC:

  // 12.2.1 References to Elements within a repeat Element

  // When the target element that is identified by the IDREF of a source object has one or more
  // repeat elements as ancestors, then the set of ancestor repeats are partitioned into two
  // subsets, those in common with the source element and those that are not in common. Any ancestor
  // repeat elements of the target element not in common with the source element are descendants of
  // the repeat elements that the source and target element have in common, if any.

  // For the repeat elements that are in common, the desired target object exists in the same set of
  // run-time objects that contains the source object. Then, for each ancestor repeat of the target
  // element that is not in common with the source element, the current index of the repeat
  // determines the set of run-time objects that contains the desired target object.
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
        // Nothing found: ignore
        break;
      case 1: {
        // A single one is found: the target object is directly in a common repeat
        const targetObject = foundTargetObjects[0];
        if (nodeName && targetObject.localName !== nodeName) {
          return null;
        }
        return targetObject;
      }
      default: {
        // Multiple target objects are found: they are in a repeat that is not common with the
        // source object We found a target object in a common repeat! We now need to find the one
        // that is in the repeatitem identified at the current index
        const targetObject = foundTargetObjects.find(to =>
          fxEvaluateXPathToNodes(
            'every $ancestor of ancestor::fx-repeatitem satisfies $ancestor is $ancestor/../child::fx-repeatitem[../@repeat-index]',
            to,
            null,
            {},
          ),
        );
        if (!targetObject) {
          // Nothing valid found for whatever reason. This might be something dynamic?
          return null;
        }
        if (nodeName && targetObject.localName !== nodeName) {
          return null;
        }
        return targetObject;
      }
    }
  }
  // We found no target objects in common repeats. The id is unresolvable
  return null;
}

// Make namespace resolving use the `instance` element that is related to here
const xmlDocument = new DOMParser().parseFromString('<xml />', 'text/xml');

const instanceReferencesByQuery = new Map();

function findInstanceReferences(xpathQuery) {
  if (!xpathQuery.includes('instance')) {
    // No call to the instance function anyway: short-circuit and prevent AST processing
    return [];
  }
  if (instanceReferencesByQuery.has(xpathQuery)) {
    return instanceReferencesByQuery.get(xpathQuery);
  }
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
/**
 * @typedef {function(string):string} NamespaceResolver
 */

/**
 * @function
 * Resolve a namespace. Needs a namespace prefix and the element that is most closely related to the
 * XPath in which the namespace is being resolved. The prefix will be resolved by using the
 * ancestry of said element.
 *
 * It has two ways of doing so:
 *
 * - If the prefix is defined in an `xmlns:XXX="YYY"` namespace declaration, it will return 'YYY'.
 * - If the prefix is the empty prefix and there is an `xpath-default-namespace="YYY"` attribute in
 * - the * ancestry, that attribute will be used and 'YYY' will be returned
 *
 * @param  {string} xpathQuery
 * @param  {HTMLElement} formElement
 * @returns {NamespaceResolver} The namespace resolver for this context
 */
export function createNamespaceResolver(xpathQuery, formElement) {
  const cachedResolver = getCachedNamespaceResolver(xpathQuery, formElement);
  if (cachedResolver) {
    return cachedResolver;
  }
  let instanceReferences = findInstanceReferences(xpathQuery);
  if (instanceReferences.length === 0) {
    // No instance functions. Look up further in the hierarchy to see if we can deduce the intended context from there
    const ancestorComponent =
      formElement.parentNode &&
      formElement.parentNode.nodeType === formElement.ELEMENT_NODE &&
      formElement.parentNode.closest('[ref]');
    if (ancestorComponent) {
      const resolver = createNamespaceResolver(
        ancestorComponent.getAttribute('ref'),
        ancestorComponent,
      );
      setCachedNamespaceResolver(xpathQuery, formElement, resolver);
      return resolver;
    }
    // Nothing found: let's just assume we're supposed to use the `default` instance
    instanceReferences = ['default'];
  }

  if (instanceReferences.length === 1) {
    // console.log(`resolving ${xpathQuery} with ${instanceReferences[0]}`);
    let instance;
    if (instanceReferences[0] === 'default') {
      /**
       * @type {HTMLElement}
       */
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
      /*
            console.log(
              `Resolving the xpath ${xpathQuery} with the default namespace set to ${xpathDefaultNamespace}`,
            );
			*/
      /**
       * @type {NamespaceResolver}
       */
      const resolveNamespacePrefix = prefix => {
        if (!prefix) {
          return xpathDefaultNamespace;
        }
        return undefined;
      };
      setCachedNamespaceResolver(xpathQuery, formElement, resolveNamespacePrefix);
      return resolveNamespacePrefix;
    }
  }

  const xpathDefaultNamespace =
    fxEvaluateXPathToString('ancestor-or-self::*/@xpath-default-namespace[last()]', formElement) ||
    '';

  /**
   * @type {NamespaceResolver}
   */
  const resolveNamespacePrefix = function resolveNamespacePrefix(prefix) {
    if (prefix === '') {
      return xpathDefaultNamespace;
    }

    // Note: ideally we should use Node#lookupNamespaceURI. However, the nodes we are passed are
    // XML. The best we can do is emulate the `xmlns:xxx` namespace declarations by regarding them as
    // attributes. Which they technically ARE NOT!

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
    // Running a query on the HTML DOM. Don't bother resolving namespaces in any other way
    return xhtmlNamespaceResolver;
  }
  return createNamespaceResolver(query, formElement);
}

/**
 * Implementation of the functionNameResolver passed to FontoXPath to
 * redirect function resolving for unprefixed functions to either the fn or the xf namespace
 */
// eslint-disable-next-line no-unused-vars
function functionNameResolver({ prefix, localName }, _arity) {
  switch (localName) {
    // TODO: put the full XForms library functions set here
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
        // The function has been declared without a prefix and is called here without a prefix.
        // Just make this work. It is the developer-friendly way
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

/**
 * Get the variables in scope of the form element. These are the values of the variables that
 * logically precede the formElement that declares the XPath
 *
 * @param  {Node}  formElement  The element that declares the XPath
 *
 * @returns  {Object}  A key-value mapping of the variables
 */
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
        // We are a var element, set the value to the value computed there
        variables[key] = varElementOrValue.value;
        // variables[key] = varElementOrValue.inScopeVariables.get(key);
      } else {
        // We are a direct value. This is used to leak in event variables
        variables[key] = varElementOrValue;
      }
    }
  }
  return variables;
}

/**
 * Evaluate an XPath to _any_ type. When possible, prefer to use any other function to ensure the
 * type of the output is more predictable.
 *
 * @param  {string} xpath  The XPath to run
 * @param  {Node} contextNode The start of the XPath
 * @param  {import('./ForeElementMixin.js').default} formElement  The form element associated to the XPath
 * @param  {Object} variables  Any variables to pass to the XPath
 * @param  {Object} options  Any options to pass to the XPath
 *
 * @returns {any[]}
 */
/*
export function evaluateXPath(xpath, contextNode, formElement, variables = {}, options={}, domFacade = null) {
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    return fxEvaluateXPath(
        xpath,
        contextNode,
        domFacade,
        {...variablesInScope, ...variables},
        fxEvaluateXPath.ALL_RESULTS_TYPE,
        {
			debug: true,
            currentContext: {formElement, variables},
            moduleImports: {
                xf: XFORMS_NAMESPACE_URI,
            },
            functionNameResolver,
            namespaceResolver,
			language: options.language || evaluateXPath.XPATH_3_1
        },
    );
}
*/

export function evaluateXPath(xpath, contextNode, formElement, variables = {}, options = {}) {
  try {
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);
    const instanceId = XPathUtil.getInstanceId(xpath, formElement);
    const instance = formElement?.getModel().getInstance(instanceId);
    const isJSON = instance?.type === 'json';

    const result = fxEvaluateXPath(
      xpath,
      contextNode,
      isJSON ? instance.domFacade : null,
      { ...variablesInScope, ...variables },
      fxEvaluateXPath.ALL_RESULTS_TYPE,
      {
        xmlSerializer: new XMLSerializer(),
        debug: true,
        currentContext: { formElement, variables },
        moduleImports: { xf: XFORMS_NAMESPACE_URI },
        functionNameResolver,
        namespaceResolver,
        language: options.language || fxEvaluateXPath.XPATH_3_1_LANGUAGE,
      },
    );
    // console.log('evaluateXPath',xpath, result);
    return result;
  } catch (e) {
    formElement.dispatchEvent(
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
/**
 * Evaluate an XPath to the first Node
 *
 * @param  {string} xpath  The XPath to run
 * @param  {Node} contextNode The start of the XPath
 * @param  {import('./ForeElementMixin.js').default} formElement  The form element associated to the XPath
 * @returns {Node} The first node found in the XPath
 */
export function evaluateXPathToFirstNode(xpath, contextNode, formElement) {
  const trimmedExpr = String(xpath ?? '').trim();
  if (contextNode && contextNode.__jsonlens__ === true && trimmedExpr === '.') {
    return [contextNode];
  }
  const lens = _resolveJsonLens(xpath, contextNode, formElement);
  if (lens) return Array.isArray(lens) ? lens[0] || null : lens;

  try {
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    const domFacade = getJsonFacade(formElement, xpath, contextNode, null);
    const isJson = !!domFacade && shouldUseJson(xpath, contextNode);
    const expr = normalizeUnaryLookup(xpath, isJson);

    const instanceId = XPathUtil.getInstanceId(expr, formElement);
    const instance = formElement?.getModel?.()?.getInstance?.(instanceId);
    const effectiveContext = isJson && !contextNode?.__jsonlens__ ? instance?.nodeset : contextNode;

    return fxEvaluateXPathToFirstNode(expr, effectiveContext, domFacade, variablesInScope, {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: { xf: XFORMS_NAMESPACE_URI },
      namespaceResolver,
      language: isJson ? Language.XQUERY_3_1_LANGUAGE : Language.XPATH_3_1_LANGUAGE,
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

/**
 * Evaluate an XPath to all nodes
 *
 * @param  {string} xpath  The XPath to run
 * @param  {Node} contextNode The start of the XPath
 * @param  {import('./ForeElementMixin.js').default} formElement  The form element associated to the XPath
 * @return {Node[]}  All nodes
 */
export function evaluateXPathToNodes(xpath, contextNode, formElement) {
  const trimmedExpr = String(xpath ?? '').trim();
  if (contextNode && contextNode.__jsonlens__ === true && trimmedExpr === '.') {
    return [contextNode];
  }
  const lensNodes = _resolveJsonLensToNodes(xpath, contextNode, formElement);
  if (lensNodes) return lensNodes;

  try {
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    const domFacade = getJsonFacade(formElement, xpath, contextNode, null);
    const isJson = !!domFacade && shouldUseJson(xpath, contextNode);
    const expr = normalizeUnaryLookup(xpath, isJson);

    const instanceId = XPathUtil.getInstanceId(expr, formElement);
    const instance = formElement?.getModel?.()?.getInstance?.(instanceId);
    const effectiveContext = isJson && !contextNode?.__jsonlens__ ? instance?.nodeset : contextNode;

    return fxEvaluateXPathToNodes(expr, effectiveContext, domFacade, variablesInScope, {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: { xf: XFORMS_NAMESPACE_URI },
      namespaceResolver,
      language: isJson ? Language.XQUERY_3_1_LANGUAGE : Language.XPATH_3_1_LANGUAGE,
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

/**
 * Evaluate an XPath to a boolean
 *
 * @param  {string} xpath  The XPath to run
 * @param  {Node} contextNode The start of the XPath
 * @param  {import('./ForeElementMixin.js').default} formElement  The form element associated to the XPath
 * @return {boolean}
 */
export function evaluateXPathToBoolean(xpath, contextNode, formElement) {
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

  try {
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    const domFacade = getJsonFacade(formElement, xpath, contextNode, null);
    const isJson = !!domFacade && shouldUseJson(xpath, contextNode);
    const expr = normalizeUnaryLookup(xpath, isJson);

    const instanceId = XPathUtil.getInstanceId(expr, formElement);
    const instance = formElement?.getModel?.()?.getInstance?.(instanceId);
    const effectiveContext = isJson && !contextNode?.__jsonlens__ ? instance?.nodeset : contextNode;

    return fxEvaluateXPathToBoolean(expr, effectiveContext, domFacade, variablesInScope, {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: { xf: XFORMS_NAMESPACE_URI },
      namespaceResolver,
      language: isJson ? Language.XQUERY_3_1_LANGUAGE : Language.XPATH_3_1_LANGUAGE,
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

/**
 * Evaluate an XPath to a string
 *
 * @param  {string}     xpath             The XPath to run
 * @param  {Node}       contextNode       The start of the XPath
 * @param  {Node}       formElement       The form element associated to the XPath
 * @param  {Node}       formElement       The element where the XPath is defined: used for namespace resolving
 * @param  {import('fontoxpath').IDomFacade}  [domFacade=null]  A DomFacade is used in bindings to intercept DOM
 * access. This is used to determine dependencies between bind elements.
 * @return {string}
 */
export function evaluateXPathToString(xpath, contextNode, formElement, domFacade = null) {
  const trimmedExpr = String(xpath ?? '').trim();
  if (contextNode && contextNode.__jsonlens__ === true && trimmedExpr === '.') {
    return [contextNode];
  }
  const lens = _resolveJsonLens(xpath, contextNode, formElement);
  if (lens && !Array.isArray(lens)) return String(lens.get());

  try {
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    const effectiveFacade = getJsonFacade(formElement, xpath, contextNode, domFacade);
    const isJson = !!effectiveFacade && shouldUseJson(xpath, contextNode);
    const expr = normalizeUnaryLookup(xpath, isJson);

    const instanceId = XPathUtil.getInstanceId(expr, formElement);
    const instance = formElement?.getModel?.()?.getInstance?.(instanceId);
    const effectiveContext = isJson && !contextNode?.__jsonlens__ ? instance?.nodeset : contextNode;

    return fxEvaluateXPathToString(expr, effectiveContext, effectiveFacade, variablesInScope, {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: { xf: XFORMS_NAMESPACE_URI },
      namespaceResolver,
      language: isJson ? Language.XQUERY_3_1_LANGUAGE : Language.XPATH_3_1_LANGUAGE,
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
    return '';
  }
}

/**
 * Evaluate an XPath to a set of strings
 *
 * @param  {string}     xpath             The XPath to run
 * @param  {Node}       contextNode       The start of the XPath
 * @param  {Node}       formElement       The form element associated to the XPath
 * @param  {Node}       formElement       The element where the XPath is defined: used for namespace resolving
 * @param  {import('fontoxpath').IDomFacade}  [domFacade=null]  A DomFacade is used in bindings to intercept DOM
 * access. This is used to determine dependencies between bind elements.
 * @return {string[]}
 */
export function evaluateXPathToStrings(xpath, contextNode, formElement, domFacade = null) {
  try {
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);

    const effectiveFacade = getJsonFacade(formElement, xpath, contextNode, domFacade);
    const isJson = !!effectiveFacade && shouldUseJson(xpath, contextNode);
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
        language: isJson ? Language.XQUERY_3_1_LANGUAGE : Language.XPATH_3_1_LANGUAGE,
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

/**
 * Evaluate an XPath to a number
 *
 * @param  {string}     xpath             The XPath to run
 * @param  {Node}       contextNode       The start of the XPath
 * @param  {Node}       formElement       The form element associated to the XPath
 * @param  {Node}       formElement       The element where the XPath is defined: used for namespace resolving
 * @param  {import('fontoxpath').IDomFacade}  [domFacade=null]  A DomFacade is used in bindings to intercept DOM
 * access. This is used to determine dependencies between bind elements.
 * @return {number}
 */
export function evaluateXPathToNumber(xpath, contextNode, formElement, domFacade = null) {
  try {
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    const effectiveFacade = getJsonFacade(formElement, xpath, contextNode, domFacade);
    const isJson = !!effectiveFacade && shouldUseJson(xpath, contextNode);
    const expr = normalizeUnaryLookup(xpath, isJson);

    const instanceId = XPathUtil.getInstanceId(expr, formElement);
    const instance = formElement?.getModel?.()?.getInstance?.(instanceId);
    const effectiveContext = isJson && !contextNode?.__jsonlens__ ? instance?.nodeset : contextNode;

    return fxEvaluateXPathToNumber(expr, effectiveContext, effectiveFacade, variablesInScope, {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: { xf: XFORMS_NAMESPACE_URI },
      namespaceResolver,
      language: isJson ? Language.XQUERY_3_1_LANGUAGE : Language.XPATH_3_1_LANGUAGE,
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

/**
 * @param id as string
 * @return instance data for given id serialized to string.
 */
registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'context' },
  [],
  'item()?',
  contextFunction,
);

/**
 * @param id as string
 * @return instance data for given id serialized to string.
 */
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

/**
 * @param id as string
 * @return instance data for given id serialized to string.
 */
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
    if (formElement.nodeType === Node.TEXT_NODE) {
      parent = formElement.parentNode;
    }
    const foreElement = parent.closest('fx-fore');
    if (foreElement.hasAttribute(string)) {
      return foreElement.getAttribute(string);
    }
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
  const formElement = fxEvaluateXPathToFirstNode(
    'ancestor-or-self::fx-fore[1]',
    dynamicContext.currentContext.formElement,
    null,
    null,
    { namespaceResolver: xhtmlNamespaceResolver },
  );

  let lookup = null;
  if (string === null || string === 'default') {
    lookup = formElement.getModel().getDefaultInstance();
  } else {
    lookup = formElement.getModel().getInstance(string);
    if (!lookup) {
      document.querySelector('fx-fore').dispatchEvent(
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
    }
  }

  const context = lookup.getDefaultContext();
  if (!context) return null;
  return context;
};

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'index' },
  ['xs:string?'],
  'xs:integer?',
  (dynamicContext, string) => {
    const { formElement } = dynamicContext.currentContext;
    if (string === null) return 1;
    const repeat = resolveId(string, formElement, 'fx-repeat');
    if (repeat) return repeat.getAttribute('index');
    return Number(1);
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
