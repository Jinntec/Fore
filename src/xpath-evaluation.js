import {
  evaluateXPath as fxEvaluateXPath,
  evaluateXPathToFirstNode as fxEvaluateXPathToFirstNode,
  evaluateXPathToNodes as fxEvaluateXPathToNodes,
  evaluateXPathToBoolean as fxEvaluateXPathToBoolean,
  evaluateXPathToString as fxEvaluateXPathToString,
  registerCustomXPathFunction,
  registerXQueryModule,
} from 'fontoxpath';
import getInScopeContext from './getInScopeContext.js';

const XFORMS_NAMESPACE_URI = 'http://www.w3.org/2002/xforms';

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'log' },
  ['xs:string?'],
  'xs:string?',
  (dynamicContext, string) => {
    const { formElement } = dynamicContext.currentContext;
    const instance = formElement.querySelector(`fx-instance[id=${string}]`);
    if (instance) {
      const def = new XMLSerializer().serializeToString(instance.getDefaultContext());
      return def;
    }
    return null;
  },
);

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'instance' },
  ['xs:string?'],
  'element()?',
  (dynamicContext, string) => {
    // Spec: https://www.w3.org/TR/xforms-xpath/#The_XForms_Function_Library#The_instance.28.29_Function
    // TODO: handle no string passed (null will be passed instead)

    const { formElement } = dynamicContext.currentContext;

    // console.log('fnInstance dynamicContext: ', dynamicContext);
    // console.log('fnInstance string: ', string);

    const instance = formElement.querySelector(`fx-instance[id=${string}]`);

    // const def = instance.getInstanceData();
    if (instance) {
      const def = instance.getDefaultContext();
      // console.log('target instance root node: ', def);

      return def;
    }
    return null;
  },
);

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'depends' },
  ['node()*'],
  'item()?',
  (dynamicContext, nodes) =>
    // console.log('depends on : ', nodes[0]);
    nodes[0],
);

// Implement the XForms standard functions here.
registerXQueryModule(`
    module namespace xf="${XFORMS_NAMESPACE_URI}";

    declare %public function xf:boolean-from-string($str as xs:string) as xs:boolean {
        lower-case($str) = "true" or $str = "1"
    };
`);

// How to run XQUERY:
/**
registerXQueryModule(`
module namespace my-custom-namespace = "my-custom-uri";
(:~
	Insert attribute somewhere
	~:)
declare %public %updating function my-custom-namespace:do-something ($ele as element()) as xs:boolean {
	if ($ele/@done) then false() else
	(insert node
	attribute done {"true"}
	into $ele, true())
};
`)
// At some point:
const contextNode = null;
const pendingUpdatesAndXdmValue = evaluateUpdatingExpressionSync('ns:do-something(.)', contextNode, null, null, {moduleImports: {'ns': 'my-custom-uri'}})

console.log(pendingUpdatesAndXdmValue.xdmValue); // this is true or false, see function

executePendingUpdateList(pendingUpdatesAndXdmValue.pendingUpdateList, null, null, null);
*/

/**
 * Implementation of the functionNameResolver passed to FontoXPath to
 * redirect function resolving for unprefixed functions to either the fn or the xf namespace
 */
// eslint-disable-next-line no-unused-vars
function functionNameResolver({ prefix, localName }, _arity) {
  switch (localName) {
    // TODO: put the full XForms library functions set here
    case 'log':
    case 'instance':
    case 'depends':
    case 'boolean-from-string':
      return { namespaceURI: XFORMS_NAMESPACE_URI, localName };
    default:
      if (prefix === '' || prefix === 'fn') {
        return { namespaceURI: 'http://www.w3.org/2005/xpath-functions', localName };
      }
      return null;
  }
}

function namespaceResolver(prefix) {
  // TODO: Do proper namespace resolving. Look at the ancestry / namespacesInScope of the declaration

  /**
   * for (let ancestor = this; ancestor; ancestor = ancestor.parentNode) {
   * 	if (ancestor.getAttribute(`xmlns:${prefix}`)) {
   *   // Return value
   *  }
   * }
   */

  // console.log('namespaceResolver  prefix', prefix);
  const ns = {
    xhtml: 'http://www.w3.org/1999/xhtml',
    // ''    : Fore.XFORMS_NAMESPACE_URI
  };
  return ns[prefix] || null;
}

/**
 * Evaluate an XPath to _any_ type. When possible, prefer to use any other function to ensure the
 * type of the output is more predictable.
 *
 * @param  {string} xpath  The XPath to run
 * @param  {Node} contextNode The start of the XPath
 * @param  {Node} formElement  The form element associated to the XPath
 */
export function evaluateXPath(xpath, contextNode, formElement, variables = {}) {
  return fxEvaluateXPath(xpath, contextNode, null, variables, 'xs:anyType', {
    currentContext: { formElement },
    moduleImports: {
      xf: XFORMS_NAMESPACE_URI,
    },
    functionNameResolver,
    namespaceResolver,
  });
}

/**
 * Evaluate an XPath to the first Node
 *
 * @param  {string} xpath  The XPath to run
 * @param  {Node} contextNode The start of the XPath
 * @param  {Node} formElement  The form element associated to the XPath
 * @return {Node}  The first node found by the XPath
 */
export function evaluateXPathToFirstNode(xpath, contextNode, formElement) {
  return fxEvaluateXPathToFirstNode(
    xpath,
    contextNode,
    null,
    {},
    {
      namespaceResolver,
      defaultFunctionNamespaceURI: XFORMS_NAMESPACE_URI,
      moduleImports: {
        xf: XFORMS_NAMESPACE_URI,
      },
      currentContext: { formElement },
    },
  );
}

/**
 * Evaluate an XPath to all nodes
 *
 * @param  {string} xpath  The XPath to run
 * @param  {Node} contextNode The start of the XPath
 * @param  {Node} formElement  The form element associated to the XPath
 * @return {Node[]}  All nodes
 */
export function evaluateXPathToNodes(xpath, contextNode, formElement) {
  return fxEvaluateXPathToNodes(
    xpath,
    contextNode,
    null,
    {},
    {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: {
        xf: XFORMS_NAMESPACE_URI,
      },
      namespaceResolver,
    },
  );
}

/**
 * Evaluate an XPath to a boolean
 *
 * @param  {string} xpath  The XPath to run
 * @param  {Node} contextNode The start of the XPath
 * @param  {Node} formElement  The form element associated to the XPath
 * @return {boolean}
 */
export function evaluateXPathToBoolean(xpath, contextNode, formElement) {
  return fxEvaluateXPathToBoolean(
    xpath,
    contextNode,
    null,
    {},
    {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: {
        xf: XFORMS_NAMESPACE_URI,
      },
      namespaceResolver,
    },
  );
}

/**
 * Evaluate an XPath to a string
 *
 * @param  {string}     xpath             The XPath to run
 * @param  {Node}       contextNode       The start of the XPath
 * @param  {Node}       formElement       The form element associated to the XPath
 * @param  {DomFacade}  [domFacade=null]  A DomFacade is used in bindings to intercept DOM
 * access. This is used to determine dependencies between bind elements.
 * @return {string}
 */
export function evaluateXPathToString(xpath, contextNode, formElement, domFacade = null) {
  return fxEvaluateXPathToString(
    xpath,
    contextNode,
    domFacade,
    {},
    {
      currentContext: { formElement },
      functionNameResolver,
      moduleImports: {
        xf: XFORMS_NAMESPACE_URI,
      },
      namespaceResolver,
    },
  );
}

/**
 * evaluate a template expression (some expression in {} brackets) on a node (either text- or attribute node.
 * @param expr the XPath to evaluate
 * @param node the node which will get updated with evaluation result
 * @param form the form element
 */
export function evaluateTemplateExpression(expr, node, form) {
  const matches = expr.match(/{[^}]*}/g);
  if (matches) {
    matches.forEach(match => {
      console.log('match ', match);
      const naked = match.substring(1, match.length - 1);
      const inscope = getInScopeContext(node, naked);
      const result = evaluateXPathToString(naked, inscope, form);

      // console.log('result of eval ', result);
      const replaced = expr.replaceAll(match, result);
      console.log('result of replacing ', replaced);

      if (node.nodeType === Node.ATTRIBUTE_NODE) {
        const parent = node.ownerElement;

        // parent.setAttribute(name, replaced);
        parent.setAttribute(node.nodeName, replaced);
      } else if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = replaced;
      }
    });
  }
}
