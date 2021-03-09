import {
	getBucketsForNode,
    registerCustomXPathFunction,
    registerXQueryModule,
} from 'fontoxpath';
import * as fx from "fontoxpath";
import {XPathUtil} from "./xpath-util";

const XFORMS_NAMESPACE_URI = 'http://www.w3.org/2002/xforms';

/**
 * Implementation of the functionNameResolver passed to FontoXPath to
 * redirect function resolving for unprefixed functions to either the fn or the xf namespace
 */
function functionNameResolver ({_prefix, localName}, _arity) {
	switch (localName) {
		// TODO: put the full XForms library functions set here
		case 'instance':
		case 'depends':
		case 'boolean-from-string':
			return {namespaceURI: 'http://www.w3.org/2002/xforms', localName};
		default:
			return {namespaceURI: 'http://www.w3.org/2005/xpath-functions', localName};
	}
}

registerCustomXPathFunction(
    { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'instance' },
    ['xs:string?'],
    'element()?',
    (dynamicContext, string) => {
        // Spec: https://www.w3.org/TR/xforms-xpath/#The_XForms_Function_Library#The_instance.28.29_Function
        // TODO: handle no string passed (null will be passed instead)

        const {formElement} = dynamicContext.currentContext || this;

        // console.log('fnInstance dynamicContext: ', dynamicContext);
        // console.log('fnInstance string: ', string);

        const instance = formElement.querySelector(`fx-instance[id=${  string  }]`);

        // const def = instance.getInstanceData();
        if(instance) {
            const def = instance.getDefaultContext();
            // console.log('target instance root node: ', def);

            return def;
        }
        return null;
    }
);

registerCustomXPathFunction(
    { namespaceURI: XFORMS_NAMESPACE_URI, localName: 'depends' },
    ['node()*'],
    'item()?',
    (dynamicContext, nodes) => {
        // Spec: https://www.w3.org/TR/xforms-xpath/#The_XForms_Function_Library#The_instance.28.29_Function
        // TODO: handle no string passed (null will be passed instead)

        const {formElement} = dynamicContext.currentContext || this;

        // console.log('fnInstance dynamicContext: ', dynamicContext);
        // console.log('depends on : ', nodes[0]);

        return nodes[0];
    }
);

// Implement the XForms standard functions here.
registerXQueryModule(`
    module namespace xf="${XFORMS_NAMESPACE_URI}";

    declare %public function xf:boolean-from-string($str as xs:string) as xs:boolean {
        lower-case($str) = "true" or $str = "1"
    };
`);

// How to run XQUF:
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
* A DomFacade that will intercept any and all accesses to _nodes_ from an XPath. Basically the same
* as the `depends` function, but less explicit and will automatically be called for any node that
* will be touched in the XPath.
*
* Maybe some more granularity is better. Maybe only notify a node's attributes are touched?
*/
class DependencyNotifyingDomFacade {

	/**
	 * @param  {function(touchedNode: Node): void)} onNodeTouched A function what will be executed whenever a node is 'touched' by the XPath
	 */
	constructor (onNodeTouched) {
		this._onNodeTouched = onNodeTouched;
	}

	/**
	 * Get all attributes of this element.
	 * The bucket can be used to narrow down which attributes should be retrieved.
	 *
	 * @param  node -
	 * @param  bucket - The bucket that matches the attribute that will be used.
	 */
	getAllAttributes(node, _bucket) {
		return node.getAllAttributes();
	}

	/**
	 * Get the value of specified attribute of this element.
	 *
	 * @param  node -
	 * @param  attributeName -
	 */
	getAttribute(node, attributeName) {
		return node.getAttribute(attributeName);
	}

	/**
	 * Get all child nodes of this element.
	 * The bucket can be used to narrow down which child nodes should be retrieved.
	 *
	 * @param  node -
	 * @param  bucket - The bucket that matches the attribute that will be used.
	 */
	getChildNodes(node, bucket) {
		const matchingNodes = node.getChildNodes().filter(childNode => getBucketsForNode(node).includes(bucket));
		matchingNodes.forEach(node => this._onNodeTouched(node));
		return matchingNodes;
	}

	/**
	 * Get the data of this element.
	 *
	 * @param  node -
	 */
	getData(node) {
		return node.data;
	}

	/**
	 * Get the first child of this element.
	 * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
	 *
	 * @param  node -
	 * @param  bucket - The bucket that matches the attribute that will be used.
	 */
	getFirstChild(node, bucket) {
		const matchingNode = node.getChildNodes().filter(childNode => getBucketsForNode(node).includes(bucket))[0];
		if (matchingNode) {
			this._onNodeTouched(matchingNode);
			return matchingNode;
		}
		return null;
	}

	/**
	 * Get the last child of this element.
	 * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
	 *
	 * @param  node -
	 * @param  bucket - The bucket that matches the attribute that will be used.
	 */
	getLastChild(node, bucket) {
		const matchingNodes = node.getChildNodes().filter(childNode => getBucketsForNode(node).includes(bucket));
		const matchingNode = matchingNode[matchingNodes.length - 1];
		if (matchingNode) {
			this._onNodeTouched(matchingNode);
			return matchingNode;
		}
		return null;
	}

	/**
	 * Get the next sibling of this node
	 * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
	 *
	 * @param  node -
	 * @param  bucket - The bucket that matches the nextSibling that is requested.
	 */
	getNextSibling(node, bucket) {
		for (let nextSibling = node.nextSibling; nextSibling; nextSibling = nextSibling.nextSibling){
			if (!getBucketsForNode(nextSibling).includes(bucket)) {
				continue;
			}

			this._onNodeTouched(nextSibling);

			return nextSibling;
		}
		return null;
	}

	/**
	 * Get the parent of this element.
	 * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
	 *
	 * @param  node -
	 * @param  bucket - The bucket that matches the attribute that will be used.
	 */
	getParentNode(node, bucket) {
		if (node.parentNode) {
			this._onNodeTouched(node.parentNode);
		}
		return node.parentNode;
	}

	/**
	 * Get the previous sibling of this element.
	 * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
	 *
	 * @param  node -
	 * @param  bucket - The bucket that matches the attribute that will be used.
	 */
	getPreviousSibling(node, bucket) {
		for (let previousSibling = node.previousSibling; previousSibling; previousSibling = previousSibling.previousSibling){
			if (!getBucketsForNode(previousSibling).includes(bucket)) {
				continue;
			}

			this._onNodeTouched(previousSibling);

			return previousSibling;
		}
		return null;
	}
}

export class Fore{

    static READONLY_DEFAULT = false;

    static REQUIRED_DEFAULT = false;

    static RELEVANT_DEFAULT = true;

    static CONSTRAINT_DEFAULT = true;

    static TYPE_DEFAULT = 'xs:string';


    static get ACTION_ELEMENTS(){
        return [
            'FX-DELETE',
            'FX-DISPATCH',
            'FX-INSERT',
            'FX-LOAD',
            'FX-MESSAGE',
            'FX-REBUILD',
            'FX-RECALCULATE',
            'FX-REFRESH',
            'FX-RENEW',
            'FX-REPLACE',
            'FX-RESET',
            'FX-RETAIN',
            'FX-RETURN',
            'FX-REVALIDATE',
            'FX-SEND',
            'FX-SETFOCUS',
            'FX-SETINDEX',
            'FX-SETVALUE',
            'FX-TOGGLE',
        ];
    }

    static namespaceResolver(prefix) {
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
            'xhtml' : 'http://www.w3.org/1999/xhtml'
            // ''    : Fore.XFORMS_NAMESPACE_URI
        };
        return ns[prefix] || null;
    }

    static getInScopeContext(node,ref){
        let resultNodeset;
        let parent;
        if(node.nodeType === Node.ATTRIBUTE_NODE){
            parent = node.ownerElement;
        }else{
            parent = node.parentNode;
        }

        const repeatItem = parent.closest('fx-repeatitem');
        if(repeatItem){
            return repeatItem.nodeset;
        }
        const parentBind = parent.closest('[ref]');

        const ownerForm = parent.closest('fx-form');
        const model = ownerForm.getModel();

        if(parentBind !== null){
            resultNodeset = parentBind.nodeset;
        }else if(XPathUtil.isAbsolutePath(ref)){
            const instanceId = XPathUtil.getInstanceId(ref);
            resultNodeset = model.getInstance(instanceId).getDefaultContext();
        }else if(model.getDefaultInstance() !== null){
            resultNodeset = model.getDefaultInstance().getDefaultContext();
        }else{
            return [];
        }
        // todo: no support for xforms 'context' yet - see https://github.com/betterFORM/betterFORM/blob/02fd3ec595fa275589185658f3011a2e2e826f4d/core/src/main/java/de/betterform/xml/xforms/XFormsElement.java#L451
        return resultNodeset;
    }

    static evaluateXPath (xpath, contextNode, formElement, namespaceResolver) {
        return fx.evaluateXPath(
            xpath,
            contextNode,
            new DependencyNotifyingDomFacade(touchedNode => console.log(`${formElement} depends on -> ${touchedNode}`)),
            {},
            'xs:anyType',
            {
                currentContext: {formElement},
                moduleImports: {
                    xf: 'http://www.w3.org/2002/xforms'
                },
                functionNameResolver,
                namespaceResolver,
            });
    }

    static evaluateToFirst (xpath, contextNode, formElement, namespaceResolver) {
        return fx.evaluateXPathToFirstNode(
            xpath,
            contextNode,
            null,
            {},
            {
                namespaceResolver,
                defaultFunctionNamespaceURI: 'http://www.w3.org/2002/xforms',
                moduleImports: {
                    xf: 'http://www.w3.org/2002/xforms'
                },
                currentContext: {formElement}
            });
    }

    static evaluateToNodes (xpath, contextNode, formElement, namespaceResolver) {
        return fx.evaluateXPathToNodes(
            xpath,
            contextNode,
            new DependencyNotifyingDomFacade(touchedNode => console.log(`${formElement} depends on -> ${touchedNode}`)),
            {},
            {
                currentContext: {formElement},
                functionNameResolver,
                moduleImports: {
                    xf: 'http://www.w3.org/2002/xforms'
                },
                namespaceResolver,
            });
    }


    static evaluateToBoolean(xpath, contextNode, formElement, namespaceResolver) {
        return fx.evaluateXPathToBoolean(
            xpath,
            contextNode,
            new DependencyNotifyingDomFacade(touchedNode => console.log(`${formElement} depends on -> ${touchedNode}`)),
            {},
            {
                currentContext: {formElement},
                functionNameResolver,
                moduleImports: {
                    xf: 'http://www.w3.org/2002/xforms'
                },
                namespaceResolver,
            });
    }

	static get XFORMS_NAMESPACE_URI () {
		return XFORMS_NAMESPACE_URI;
	}

    static isActionElement(elementName){
        const found = Fore.ACTION_ELEMENTS.includes(elementName);
        // console.log('isActionElement ', found);
        return Fore.ACTION_ELEMENTS.includes(elementName);
    }

    static get UI_ELEMENTS(){
        return [
            'FX-ALERT',
            'FX-CONTROL',
            'FX-BUTTON',
            'FX-CONTROL',
            'FX-DIALOG',
            'FX-FILENAME',
            'FX-MEDIATYPE',
            'FX-GROUP',
            'FX-HINT',
            'FX-INPUT',
            'FX-ITEMSET',
            'FX-LABEL',
            'FX-OUTPUT',
            'FX-RANGE',
            'FX-REPEAT',
            'FX-REPEATITEM',
            'FX-SWITCH',
            'FX-SECRET',
            'FX-SELECT',
            'FX-SUBMIT',
            'FX-TEXTAREA',
            'FX-TRIGGER',
            'FX-UPLOAD'
        ];
    }


    static isUiElement(elementName){
        const found = Fore.UI_ELEMENTS.includes(elementName);
        if(found){
            // console.log('_isUiElement ', found);
        }
        return Fore.UI_ELEMENTS.includes(elementName);
    }



    static refreshChildren(startElement){
        const children = startElement.children;
        if(children){
            Array.from(children).forEach(element => {

                // todo: later - check for AVTs
                if (Fore.isUiElement(element.nodeName) && typeof element.refresh === 'function') {
                    element.refresh();
                }else{
                    if(element.nodeName !== 'fx-MODEL'){
                        Fore.refreshChildren(element);
                    }
                }

            });
        }
        // startElement.requestUpdat();
    }

    /**
     * clear all text nodes and attribute values to get a 'clean' template.
     * @param n
     * @private
     */
    static clear(n){
        n.textContent = '';
        if(n.hasAttributes()){
            const attrs = n.attributes;
            for (let i = 0; i < attrs.length; i++) {
                attrs[i].value = '';
            }
        }
        const children = n.children;
        for (let i = 0 ; i< children.length; i++){
            Fore.clear(children[i]);
        }

    }


}
