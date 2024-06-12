import { evaluateXPathToFirstNode } from './xpath-evaluation.js';
import {XPathUtil} from './xpath-util.js';

/**
 * @param {Node} node
 * @returns {HTMLElement}
 */
function _getElement(node) {
    if (node && node.nodeType && node.nodeType === Node.ATTRIBUTE_NODE) {
        // The context of an attribute is the ref of the element it's defined on
        return node.ownerElement;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        // The context of a query should be the element having a ref
        return node;
    }

    // For text nodes, just start looking from the parent element
    return node.parentNode;
}

function _getForeContext(node) {
    return XPathUtil.getClosest( 'fx-fore', node);
}

function _getModelInContext(node) {
    // const ownerForm = node.closest('fx-fore');
    const ownerForm = _getForeContext(node);
    return ownerForm.getModel();
}

function _getInitialContext(node, ref) {
    const parentBind = XPathUtil.getClosest('[ref]', node);
    const localFore = XPathUtil.getClosest('fx-fore', node);

    const model = _getModelInContext(node);

    if (parentBind !== null) {
        /*
        make sure that the closest ref belongs to the same fx-fore element
        */
        const parentBindFore = parentBind.closest('fx-fore');
        if (localFore === parentBindFore) {
            return parentBind.nodeset;
        }
        return model.getDefaultInstance().getDefaultContext();
    }

    if (XPathUtil.isAbsolutePath(ref)) {
        const instanceId = XPathUtil.getInstanceId(ref);
        if (instanceId) {
            return model.getInstance(instanceId).getDefaultContext();
        }
        return model.getDefaultInstance().getDefaultContext();
    }
    // should always return default context if all other fails
    return model.getDefaultInstance().getDefaultContext();
}

/**
 * Get the inscope context for an XPath defined on an element, attribute or in a textnode. Uses the
 * current iterate status, repeats, etcetera
 *
 * @param {Node} node The context node at this point. Can be an attribute
 * @param {string} ref The XPath to resolve for
 * @return {Node} The context item for this XPath
 */
export default function getInScopeContext(node, ref) {
    // console.log('getInScopeContext', ref, node);


    const parentElement = _getElement(node);
    // console.log('getInScopeContext parent', parentElement);

    if(parentElement.nodeName === 'FX-FORE'){
        const context = parentElement.getModel().getDefaultInstance()?.getDefaultContext();
		if (!context) {
			// Edge-case, we are in an inner fore. Use the outer fore's default context
			return getInScopeContext(parentElement.parentNode, ref);
		}
		return context;
    }
    const parentBind = XPathUtil.getClosest('[ref]', parentElement.parentNode);
    if (parentBind && (parentBind.nodeName === 'FX-GROUP' || parentBind.nodeName === 'FX-CONTROL')) {
        return parentBind.nodeset;
    }

	const parentActionWithIterateExpr = parentElement.matches('[iterate]') ? parentElement : XPathUtil.getClosest('[iterate]', parentElement.parentNode);
	if (parentActionWithIterateExpr && parentActionWithIterateExpr.currentContext) {
		return parentActionWithIterateExpr.currentContext;
	}

    const repeatItem = XPathUtil.getClosest('fx-repeatitem', parentElement);
    if (repeatItem) {
        if (node.nodeName === 'context') {
            return evaluateXPathToFirstNode(
                node.nodeValue,
                repeatItem.nodeset,
                _getForeContext(parentElement),
            );
        }
        return repeatItem.nodeset;
    }

  // ### check for repeatitems created by fx-repeat-attributes - this could possibly be unified with standard repeats
  // const repeatItemFromAttrs = XPathUtil.getClosest('.fx-repeatitem', parentElement);
  // const repeatItemFromAttrs = XPathUtil.getClosest('.fx-repeatitem', parentElement);
  const repeatItemFromAttrs = parentElement.closest('.fx-repeatitem');

  if (repeatItemFromAttrs) {
    // ### determine correct inscopecontext by determining the index of the repeatitem in its parent list and
    // ### using that as an index on the repeat nodeset
    const parent = repeatItemFromAttrs.parentNode;
    const index = Array.from(parent.children).indexOf(repeatItemFromAttrs);

    // ### fetching nodeset from fx-repeat-attributes element
    const repeatFromAttributes = XPathUtil.getClosest('fx-repeat-attributes', parentElement);
    return repeatFromAttributes.nodeset[index];
  }

    if (parentElement.hasAttribute('context')) {
        const initialContext = _getInitialContext(parentElement.parentNode, ref);
        const contextAttr = parentElement.getAttribute('context');
        return evaluateXPathToFirstNode(contextAttr, initialContext, _getForeContext(parentElement));
    }

    if (node.nodeType === Node.ATTRIBUTE_NODE && node.nodeName === 'context') {
        const initialContext = _getInitialContext(node.ownerElement.parentNode, ref);
        const contextAttr = node.ownerElement.getAttribute('context');
        return evaluateXPathToFirstNode(contextAttr, initialContext, _getForeContext(parentElement));
    }
    if (node.nodeType === Node.ATTRIBUTE_NODE && node.nodeName === 'ref') {
        // Note: do not consider the ref of the owner element since it should not be used to define the
        // context
        if (node.ownerElement.hasAttribute('context')) {
            const initialContext = _getInitialContext(node.ownerElement.parentNode, ref);
            const contextAttr = node.ownerElement.getAttribute('context');
            return evaluateXPathToFirstNode(contextAttr, initialContext, _getForeContext(parentElement));
        }

        // Never resolve the context from a ref itself!
        return _getInitialContext(parentElement.parentNode, ref);
    }

    // if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('context')) {
    //   const initialContext = _getInitialContext(node.parentNode, ref);
    //   const contextAttr = node.getAttribute('context');
    //   return evaluateXPathToFirstNode(contextAttr, initialContext, _getForeContext(parentElement));
    // }
    return _getInitialContext(parentElement, ref);
}
