import {
  evaluateXPath as fxEvaluateXPath,
  evaluateXPathToFirstNode as fxEvaluateXPathToFirstNode,
  evaluateXPathToNodes as fxEvaluateXPathToNodes,
  evaluateXPathToBoolean as fxEvaluateXPathToBoolean,
  evaluateXPathToString as fxEvaluateXPathToString,
    evaluateXPathToNumber as fxEvaluateXPathToNumber,
  registerCustomXPathFunction,
  registerXQueryModule,
} from 'fontoxpath';
import getInScopeContext from './getInScopeContext.js';

const XFORMS_NAMESPACE_URI = 'http://www.w3.org/2002/xforms';

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
    const instance = formElement.querySelector(`fx-instance[id=${string}]`);
    if (instance) {
      const def = new XMLSerializer().serializeToString(instance.getDefaultContext());
      return def;
    }
    return null;
  },
);

function buildTree(tree, data) {
  if (!data) return;
  if (data.nodeType === Node.ELEMENT_NODE) {
    if (data.children) {
      const details = document.createElement('details');
      details.setAttribute('data-path', data.nodeName);
      const summary = document.createElement('summary');

      let display = ` <${data.nodeName}`;
      Array.from(data.attributes).forEach(attr => {
        display += ` ${attr.nodeName}="${attr.nodeValue}"`;
      });

      let contents;
      if (
        data.firstChild &&
        data.firstChild.nodeType === Node.TEXT_NODE &&
        data.firstChild.data.trim() !== ''
      ) {
        // console.log('whoooooooooopp');
        contents = data.firstChild.nodeValue;
        display += `>${contents}</${data.nodeName}>`;
      } else {
        display += '>';
      }
      summary.textContent = display;

      details.appendChild(summary);
      if (data.childElementCount !== 0) {
        details.setAttribute('open', 'open');
      } else {
        summary.setAttribute('style', 'list-style:none;');
      }
      tree.appendChild(details);

      Array.from(data.children).forEach(child => {
        // if(child.nodeType === Node.ELEMENT_NODE){
        // child.parentNode.appendChild(buildTree(child));
        buildTree(details, child);
        // }
      });
    }
  } /* else if(data.nodeType === Node.ATTRIBUTE_NODE){
        //create span for now
        // const span = document.createElement('span');
        // span.style.background = 'grey';
        // span.textContent = data.value;
        // tree.appendChild(span);
        tree.setAttribute(data.nodeName,data.value);
    }else {
        tree.textContent = data;
    } */

  // return tree;
}

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'logtree' },
  ['xs:string?'],
  'element()?',
  (dynamicContext, string) => {
    const { formElement } = dynamicContext.currentContext;
    const instance = formElement.querySelector(`fx-instance[id=${string}]`);
    if (instance) {
      // const def = new XMLSerializer().serializeToString(instance.getDefaultContext());
      // const def = JSON.stringify(instance.getDefaultContext());

      const tree = document.createElement('div');
      tree.setAttribute('class', 'logtree');
      // const datatree = buildTree(tree,instance.getDefaultContext());
      // return tree.appendChild(datatree);
      // return  buildTree(root,instance.getDefaultContext());;
      const form = dynamicContext.currentContext.formElement;
      const logtree = form.querySelector('.logtree');
      if (logtree) {
        logtree.parentNode.removeChild(logtree);
      }
        form.appendChild(buildTree(tree, instance.getDefaultContext()));
    }
    return null;
  },
);


const instance = (dynamicContext, string) => {
  // Spec: https://www.w3.org/TR/xforms-xpath/#The_XForms_Function_Library#The_instance.28.29_Function
  // TODO: handle no string passed (null will be passed instead)

  const { formElement } = dynamicContext.currentContext;

  // console.log('fnInstance dynamicContext: ', dynamicContext);
  // console.log('fnInstance string: ', string);

  const inst = string
    ? formElement.querySelector(`fx-instance[id=${string}]`)
    : formElement.querySelector(`fx-instance`);

  // const def = instance.getInstanceData();
  if (inst) {
    const def = inst.getDefaultContext();
    // console.log('target instance root node: ', def);

    return def;
  }
  return null;
};

registerCustomXPathFunction(
    { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'index' },
    ['xs:string?'],
    'xs:integer?',
    (dynamicContext, string) => {
        const { formElement } = dynamicContext.currentContext;
        const repeat = string
            ? formElement.querySelector(`fx-repeat[id=${string}]`)
            : null;

        // const def = instance.getInstanceData();
        if (repeat) {
            return repeat.getAttribute('index');
        }
        return Number(1);
    }
);

// Note that this is not to spec. The spec enforces elements to be returned from the
// instance. However, we allow instances to actually be JSON!
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

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'depends' },
  ['node()*'],
  'item()?',
  (dynamicContext, nodes) =>
    // console.log('depends on : ', nodes[0]);
    nodes[0],
);

registerCustomXPathFunction(
  { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'event' },
  ['xs:string?'],
  'item()?',
  (dynamicContext, arg) => {
    const payload = dynamicContext.currentContext.variables[arg];
    if (payload.nodeType) {
      console.log('got some node as js object');
    }

    return dynamicContext.currentContext.variables[arg];
  },
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
    case 'boolean-from-string':
    case 'depends':
    case 'event':
    case 'index':
    case 'instance':
    case 'log':
    case 'logtree':
      return { namespaceURI: XFORMS_NAMESPACE_URI, localName };
    default:
      if (prefix === '' || prefix === 'fn') {
        return { namespaceURI: 'http://www.w3.org/2005/xpath-functions', localName };
      }
      if (prefix === 'local') {
        return { namespaceURI: 'http://www.w3.org/2005/xquery-local-functions', localName };
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
    tei: 'http://www.tei-c.org/ns/1.0',
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
    currentContext: { formElement, variables },
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
 * Evaluate an XPath to a number
 *
 * @param  {string}     xpath             The XPath to run
 * @param  {Node}       contextNode       The start of the XPath
 * @param  {Node}       formElement       The form element associated to the XPath
 * @param  {DomFacade}  [domFacade=null]  A DomFacade is used in bindings to intercept DOM
 * access. This is used to determine dependencies between bind elements.
 * @return {string}
 */
export function evaluateXPathToNumber(xpath, contextNode, formElement, domFacade = null) {
    return fxEvaluateXPathToNumber(
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
