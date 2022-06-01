import { evaluateXPathToFirstNode } from './xpath-evaluation.js';

import { XPathUtil } from './xpath-util.js';


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
  return node.closest('fx-fore');
}

function _getModelInContext(node) {
  // const ownerForm = node.closest('fx-fore');
  const ownerForm = _getForeContext(node);
  return ownerForm.getModel();
}

function _getInitialContext(node, ref) {
  const parentBind = node.closest('[ref]');
  const localFore = node.closest('fx-fore');

  const model = _getModelInContext(node);

  if (parentBind !== null) {
    /*
    make sure that the closest ref belongs to the same fx-fore element
    */
    const parentBindFore = parentBind.closest('fx-fore');
    if(localFore === parentBindFore){
      return parentBind.nodeset;
    }
    return model.getDefaultInstance().getDefaultContext();

  }

  if (XPathUtil.isAbsolutePath(ref)) {
    const instanceId = XPathUtil.getInstanceId(ref);
    if(instanceId){
      return model.getInstance(instanceId).getDefaultContext();
    }
    return model.getDefaultInstance().getDefaultContext();
  }
  if (model.getDefaultInstance() !== null && model.inited) {
    return model.getDefaultInstance().getDefaultContext();
  }
  return [];
}

export default function getInScopeContext(node, ref) {
  const parentElement = _getElement(node);

  const repeatItem = parentElement.closest('fx-repeatitem');
  if (repeatItem) {
    if(node.nodeName === 'context'){
      return evaluateXPathToFirstNode(node.nodeValue, repeatItem.nodeset, _getForeContext(parentElement));
    }
    return repeatItem.nodeset;
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
