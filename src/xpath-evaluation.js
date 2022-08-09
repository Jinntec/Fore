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
} from 'fontoxpath';
import {Fore} from './fore.js';

import {XPathUtil} from './xpath-util.js';

const XFORMS_NAMESPACE_URI = 'http://www.w3.org/2002/xforms';

const createdNamespaceResolversByXPathQueryAndNode = new Map();

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
        return createdNamespaceResolversByXPathQueryAndNode.set(xpath, new Map());
    }
    return createdNamespaceResolversByXPathQueryAndNode.get(xpath).set(node, resolver);
}

const xhtmlNamespaceResolver = prefix => {
    if (!prefix) {
        return 'http://www.w3.org/1999/xhtml';
    }
    return undefined;
};

/**
 * Resolve an id in scope. Behaves like the algorithm defined on https://www.w3.org/community/xformsusers/wiki/XForms_2.0#idref-resolve
 */
export function resolveId(id, sourceObject, nodeName = null) {
    const allMatchingTargetObjects = fxEvaluateXPathToNodes(
        'outermost(ancestor-or-self::fx-fore[1]/(descendant::fx-fore|descendant::*[@id = $id]))[not(self::fx-fore)]',
        sourceObject,
        null,
        {id},
        {namespaceResolver: xhtmlNamespaceResolver},
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
            {namespaceResolver: xhtmlNamespaceResolver},
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
        {namespaceResolver: xhtmlNamespaceResolver},
    )) {
        const foundTargetObjects = allMatchingTargetObjects.filter(to =>
            ancestorRepeatItem.contains(to),
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
                // Multiple target objects are found: they are in a repeat that is not common with the source object
                // We found a target object in a common repeat! We now need to find the one that is in the repeatitem identified at the current index
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

/**
 * Resolve a namespace. Needs a namespace prefix and the element that is most closely related to the
 * XPath in which the namespace is being resolved. The prefix will be resolved by using the
 * ancestry of said element.
 *
 * It has two ways of doing so:
 *
 * - If the prefix is defined in an `xmlns:XXX="YYY"` namespace declaration, it will return 'YYY'.
 * - If the prefix is the empty prefix and there is an `xpath-default-namespace="YYY"` attribute in the
 * - ancestry, that attribute will be used and 'YYY' will be returned
 *
 * @param  {Node}  contextElement  The element that is most closely related with the XPath in which this prefix is resolved.
 * @param  {string}   prefix          The prefix to resolve
 */
function createNamespaceResolver(xpathQuery, formElement) {
    const cachedResolver = getCachedNamespaceResolver(xpathQuery, formElement);
    if (cachedResolver) {
        return cachedResolver;
    }

    // Make namespace resolving use the `instance` element that is related to here
    const xmlDocument = new DOMParser().parseFromString('<xml />', 'text/xml');

    const xpathAST = parseScript(xpathQuery, {}, xmlDocument);
    let instanceReferences = fxEvaluateXPathToStrings(
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
    if (instanceReferences.length === 0) {
        // No instance functions. Look up further in the hierarchy to see if we can deduce the intended context from there
        const ancestorComponent = fxEvaluateXPathToFirstNode('ancestor::*[@ref][1]', formElement);
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
            const actualForeElement = fxEvaluateXPathToFirstNode(
                'ancestor-or-self::fx-fore[1]',
                formElement,
                null,
                null,
                {namespaceResolver: xhtmlNamespaceResolver},
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
    if (instanceReferences.length > 1) {
        console.warn(
            `More than one instance is used in the query "${xpathQuery}". The default namespace resolving will be used`,
        );
    }

    const xpathDefaultNamespace =
        fxEvaluateXPathToString('ancestor-or-self::*/@xpath-default-namespace[last()]', formElement) ||
        '';

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
            {prefix},
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
function functionNameResolver({prefix, localName}, _arity) {
    switch (localName) {
        // TODO: put the full XForms library functions set here
        case 'context':
        case 'base64encode':
        case 'boolean-from-string':
        case 'current':
        case 'depends':
        case 'event':
        case 'index':
        case 'instance':
        case 'log':
        case 'parse':
        case 'logtree':
            return {namespaceURI: XFORMS_NAMESPACE_URI, localName};
        default:
            if (prefix === '' && globallyDeclaredFunctionLocalNames.includes(localName)) {
                // The function has been declared without a prefix and is called here without a prefix.
                // Just make this work. It is the developer-friendly way
                return {namespaceURI: 'http://www.w3.org/2005/xquery-local-functions', localName};
            }
            if (prefix === 'fn' || prefix === '') {
                return {namespaceURI: 'http://www.w3.org/2005/xpath-functions', localName};
            }
            if (prefix === 'local') {
                return {namespaceURI: 'http://www.w3.org/2005/xquery-local-functions', localName};
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
 * @return  {Object}  A key-value mapping of the variables
 */
function getVariablesInScope(formElement) {
    let closestActualFormElement = formElement;
    while (closestActualFormElement && !('inScopeVariables' in closestActualFormElement)) {
        closestActualFormElement = closestActualFormElement.parentNode;
    }

    if (!closestActualFormElement) {
        return {};
    }

    const variables = {};
    if (closestActualFormElement.inScopeVariables) {
        for (const key of closestActualFormElement.inScopeVariables.keys()) {
            const varElement = closestActualFormElement.inScopeVariables.get(key);
            variables[key] = varElement.value;
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
 * @param  {{parentNode}|ForeElementMixin} formElement  The form element associated to the XPath
 */
export function evaluateXPath(xpath, contextNode, formElement, variables = {}) {
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    return fxEvaluateXPath(
        xpath,
        contextNode,
        null,
        {...variablesInScope, ...variables},
        fxEvaluateXPath.ALL_RESULTS_TYPE,
        {
            currentContext: {formElement, variables},
            moduleImports: {
                xf: XFORMS_NAMESPACE_URI,
            },
            functionNameResolver,
            namespaceResolver,
        },
    );
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
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);
    return fxEvaluateXPathToFirstNode(xpath, contextNode, null, variablesInScope, {
        defaultFunctionNamespaceURI: XFORMS_NAMESPACE_URI,
        moduleImports: {
            xf: XFORMS_NAMESPACE_URI,
        },
        currentContext: {formElement},
        functionNameResolver,
        namespaceResolver,
    });
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
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    return fxEvaluateXPathToNodes(xpath, contextNode, null, variablesInScope, {
        currentContext: {formElement},
        functionNameResolver,
        moduleImports: {
            xf: XFORMS_NAMESPACE_URI,
        },
        namespaceResolver,
    });
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
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    return fxEvaluateXPathToBoolean(xpath, contextNode, null, variablesInScope, {
        currentContext: {formElement},
        functionNameResolver,
        moduleImports: {
            xf: XFORMS_NAMESPACE_URI,
        },
        namespaceResolver,
    });
}

/**
 * Evaluate an XPath to a string
 *
 * @param  {string}     xpath             The XPath to run
 * @param  {Node}       contextNode       The start of the XPath
 * @param  {Node}       formElement       The form element associated to the XPath
 * @param  {DomFacade}  [domFacade=null]  A DomFacade is used in bindings to intercept DOM
 * access. This is used to determine dependencies between bind elements.
 * @param  {Node}       formElement       The element where the XPath is defined: used for namespace resolving
 * @return {string}
 */
export function evaluateXPathToString(
    xpath,
    contextNode,
    formElement,
    domFacade = null,
    namespaceReferenceNode = formElement,
) {
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    return fxEvaluateXPathToString(xpath, contextNode, domFacade, variablesInScope, {
        currentContext: {formElement},
        functionNameResolver,
        moduleImports: {
            xf: XFORMS_NAMESPACE_URI,
        },
        namespaceResolver,
    });
}

/**
 * Evaluate an XPath to a set of strings
 *
 * @param  {string}     xpath             The XPath to run
 * @param  {Node}       contextNode       The start of the XPath
 * @param  {Node}       formElement       The form element associated to the XPath
 * @param  {DomFacade}  [domFacade=null]  A DomFacade is used in bindings to intercept DOM
 * access. This is used to determine dependencies between bind elements.
 * @param  {Node}       formElement       The element where the XPath is defined: used for namespace resolving
 * @return {string}
 */
export function evaluateXPathToStrings(
    xpath,
    contextNode,
    formElement,
    domFacade = null,
    namespaceReferenceNode = formElement,
) {
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    return fxEvaluateXPathToStrings(
        xpath,
        contextNode,
        domFacade,
        {},

        {
            currentContext: {formElement},
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
 * @param  {Node}       formElement       The element where the XPath is defined: used for namespace resolving
 * access. This is used to determine dependencies between bind elements.
 * @return {Number}
 */
export function evaluateXPathToNumber(
    xpath,
    contextNode,
    formElement,
    domFacade = null,
    namespaceReferenceNode = formElement,
) {
    const namespaceResolver = createNamespaceResolverForNode(xpath, contextNode, formElement);
    const variablesInScope = getVariablesInScope(formElement);

    return fxEvaluateXPathToNumber(xpath, contextNode, domFacade, variablesInScope, {
        currentContext: {formElement},
        functionNameResolver,
        moduleImports: {
            xf: XFORMS_NAMESPACE_URI,
        },
        namespaceResolver,
    });
}

const contextFunction = (dynamicContext, string) => {
    const caller = dynamicContext.currentContext.formElement;
    if (string) {
        const instance = resolveId(string, caller);
        if (instance) {
            if (instance.nodeName === 'FX-REPEAT') {
                const {nodeset} = instance;
                for (let parent = caller; parent; parent = parent.parentNode) {
                    if (parent.parentNode === instance) {
                        const offset = Array.from(parent.parentNode.children).indexOf(parent);
                        return nodeset[offset];
                    }
                }
            }
            return instance.nodeset;
        }
    }
    const parent = XPathUtil.getParentBindingElement(caller);
    // const p = caller.nodeName;
    // const p = dynamicContext.domFacade.getParentElement();

    if (parent) return parent;
    return caller.getInScopeContext();
};

// todo: implement
const currentFunction = (dynamicContext, string) => {
    const caller = dynamicContext.currentContext.formElement;
    return null;
};

/**
 * @param id as string
 * @return instance data for given id serialized to string.
 */
registerCustomXPathFunction(
    {namespaceURI: XFORMS_NAMESPACE_URI, localName: 'context'},
    [],
    'item()?',
    contextFunction,
);

/**
 * @param id as string
 * @return instance data for given id serialized to string.
 */
registerCustomXPathFunction(
    {namespaceURI: XFORMS_NAMESPACE_URI, localName: 'context'},
    ['xs:string'],
    'item()?',
    contextFunction,
);

registerCustomXPathFunction(
    {namespaceURI: XFORMS_NAMESPACE_URI, localName: 'current'},
    ['xs:string'],
    'item()?',
    currentFunction,
);

/**
 * @param id as string
 * @return instance data for given id serialized to string.
 */
registerCustomXPathFunction(
    {namespaceURI: XFORMS_NAMESPACE_URI, localName: 'log'},
    ['xs:string?'],
    'xs:string?',
    (dynamicContext, string) => {
        const {formElement} = dynamicContext.currentContext;
        const instance = resolveId(string, formElement, 'fx-instance');
        if (instance) {
            if (instance.getAttribute('type') === 'json') {
                console.warn('log() does not work for JSON yet');
                // return JSON.stringify(instance.getDefaultContext());
            } else {
                const def = new XMLSerializer().serializeToString(instance.getDefaultContext());
                return Fore.prettifyXml(def);
            }
        }
        return null;
    },
);

registerCustomXPathFunction(
    {namespaceURI: XFORMS_NAMESPACE_URI, localName: 'parse'},
    ['xs:string?'],
    'element()?',
    (dynamicContext, string) => {
        const parser = new DOMParser();
        const out = parser.parseFromString(string, "application/xml");
        console.log('parse', out);

        /*
                const {formElement} = dynamicContext.currentContext;
                const instance = resolveId(string, formElement, 'fx-instance');
                if (instance) {
                    if (instance.getAttribute('type') === 'json') {
                        console.warn('log() does not work for JSON yet');
                        // return JSON.stringify(instance.getDefaultContext());
                    } else {
                        const def = new XMLSerializer().serializeToString(instance.getDefaultContext());
                        return Fore.prettifyXml(def);
                    }
                }
        */
        return out.firstElementChild;
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
    {namespaceURI: XFORMS_NAMESPACE_URI, localName: 'logtree'},
    ['xs:string?'],
    'element()?',
    (dynamicContext, string) => {
        const {formElement} = dynamicContext.currentContext;
        const instance = resolveId(string, formElement, 'fx-instance');

        if (instance) {
            // const def = new XMLSerializer().serializeToString(instance.getDefaultContext());
            // const def = JSON.stringify(instance.getDefaultContext());

            const treeDiv = document.createElement('div');
            treeDiv.setAttribute('class', 'logtree');
            // const datatree = buildTree(tree,instance.getDefaultContext());
            // return tree.appendChild(datatree);
            // return  buildTree(root,instance.getDefaultContext());;
            const form = dynamicContext.currentContext.formElement;
            const logtree = form.querySelector('.logtree');
            if (logtree) {
                logtree.parentNode.removeChild(logtree);
            }
            const tree = buildTree(treeDiv, instance.getDefaultContext());
            if (tree) {
                form.appendChild(tree);
            }
        }
        return null;
    },
);

const instance = (dynamicContext, string) => {
    // Spec: https://www.w3.org/TR/xforms-xpath/#The_XForms_Function_Library#The_instance.28.29_Function
    // TODO: handle no string passed (null will be passed instead)

    const formElement = fxEvaluateXPathToFirstNode(
        'ancestor-or-self::fx-fore[1]',
        dynamicContext.currentContext.formElement,
        null,
        null,
        {namespaceResolver: xhtmlNamespaceResolver},
    );

    // console.log('fnInstance dynamicContext: ', dynamicContext);
    // console.log('fnInstance string: ', string);

    const inst = string
        ? resolveId(string, formElement, 'fx-instance')
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
    {namespaceURI: XFORMS_NAMESPACE_URI, localName: 'index'},
    ['xs:string?'],
    'xs:integer?',
    (dynamicContext, string) => {
        const {formElement} = dynamicContext.currentContext;
        if (string === null) {
            return 1;
        }
        const repeat = resolveId(string, formElement, 'fx-repeat');

        // const def = instance.getInstanceData();
        if (repeat) {
            return repeat.getAttribute('index');
        }
        return Number(1);
    },
);

// Note that this is not to spec. The spec enforces elements to be returned from the
// instance. However, we allow instances to actually be JSON!
registerCustomXPathFunction(
    {namespaceURI: XFORMS_NAMESPACE_URI, localName: 'instance'},
    [],
    'item()?',
    domFacade => instance(domFacade, null),
);

registerCustomXPathFunction(
    {namespaceURI: XFORMS_NAMESPACE_URI, localName: 'instance'},
    ['xs:string?'],
    'item()?',
    instance,
);

registerCustomXPathFunction(
    {namespaceURI: XFORMS_NAMESPACE_URI, localName: 'depends'},
    ['node()*'],
    'item()?',
    (dynamicContext, nodes) =>
        // console.log('depends on : ', nodes[0]);
        nodes[0],
);

registerCustomXPathFunction(
    {namespaceURI: XFORMS_NAMESPACE_URI, localName: 'event'},
    ['xs:string?'],
    'item()?',
    (dynamicContext, arg) => {
        if (!arg) return [];

        if (dynamicContext.currentContext.variables) {
            const payload = dynamicContext.currentContext.variables[arg];
            if (payload.nodeType) {
                console.log('got some node as js object');
            }
            if (payload) {
                return dynamicContext.currentContext.variables[arg];
            }
        }

        if (dynamicContext.currentContext.formElement.inScopeVariables) {
            console.log('event()', dynamicContext.currentContext.formElement.inScopeVariables);
            console.log('event()', dynamicContext.currentContext.formElement.inScopeVariables.get(arg));
            // dynamicContext.currentContext.variables = dynamicContext.currentContext.formElement.inScopeVariables;
            return dynamicContext.currentContext.formElement.inScopeVariables.get(arg);
        }

        return [];
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
 * @param input as string
 * @return {string}
 */
registerCustomXPathFunction(
    {namespaceURI: XFORMS_NAMESPACE_URI, localName: 'base64encode'},
    ['xs:string?'],
    'xs:string?',
    (dynamicContext, string) => btoa(string),
);
