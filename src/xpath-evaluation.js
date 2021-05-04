import {
  evaluateXPath as fxEvaluateXPath,
  evaluateXPathToFirstNode as fxEvaluateXPathToFirstNode,
  evaluateXPathToNodes as fxEvaluateXPathToNodes,
  evaluateXPathToBoolean as fxEvaluateXPathToBoolean,
  evaluateXPathToString as fxEvaluateXPathToString,
  registerCustomXPathFunction,
  registerXQueryModule,
} from 'fontoxpath';

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
function functionNameResolver({ _prefix, localName }, _arity) {
  switch (localName) {
    // TODO: put the full XForms library functions set here
    case 'log':
    case 'instance':
    case 'depends':
    case 'boolean-from-string':
      return { namespaceURI: XFORMS_NAMESPACE_URI, localName };
    default:
      return { namespaceURI: 'http://www.w3.org/2005/xpath-functions', localName };
  }
}

/**
 * Evaluate an XPath to _any_ type. When possible, prefer to use any other function to ensure the
 * type of the output is more predictable.
 *
 * @param  {string} xpath  The XPath to run
 * @param  {Node} contextNode The start of the XPath
 * @param  {Node} formElement  The form element associated to the XPath
 * @param {(string)=>string|undefined} namespaceResolver Used to resolve namespaces. This must be the
 * namespace resolver in the scope of the element this XPath is declared on
 * @return {any}
 */
export function evaluateXPath(xpath, contextNode, formElement, namespaceResolver) {
  return fxEvaluateXPath(xpath, contextNode, null, {}, 'xs:anyType', {
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
 * @param {(string)=>string|undefined} namespaceResolver Used to resolve namespaces. This must be the
 * namespace resolver in the scope of the element this XPath is declared on
 * @return {Node}  The first node found by the XPath
 */
export function evaluateXPathToFirstNode(xpath, contextNode, formElement, namespaceResolver) {
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
 * @param {(string)=>string|undefined} namespaceResolver Used to resolve namespaces. This must be the
 * namespace resolver in the scope of the element this XPath is declared on
 * @return {Node[]}  All nodes
 */
export function evaluateXPathToNodes(xpath, contextNode, formElement, namespaceResolver) {
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
 * @param {(string)=>string|undefined} namespaceResolver Used to resolve namespaces. This must be the
 * namespace resolver in the scope of the element this XPath is declared on
 * @return {boolean}
 */
export function evaluateXPathToBoolean(xpath, contextNode, formElement, namespaceResolver) {
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
 * @param  {string} xpath  The XPath to run
 * @param  {Node} contextNode The start of the XPath
 * @param  {Node} formElement  The form element associated to the XPath
 * @param {(string)=>string|undefined} namespaceResolver Used to resolve namespaces. This must be the
 * namespace resolver in the scope of the element this XPath is declared on
 * @return {string}
 */
export function evaluateXPathToString(xpath, contextNode, formElement, namespaceResolver) {
  return fxEvaluateXPathToString(
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
