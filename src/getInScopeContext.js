// import evaluateXPathToNodes from './xpath-evaluation.js';
import { evaluateXPathToNodes, evaluateXPathToFirstNode } from './xpath-evaluation.js';

import { XPathUtil } from './xpath-util.js';

function _getParentElement(node){
  if (node.nodeType === Node.ATTRIBUTE_NODE) {
    return node.ownerElement;
  }
  return  node.parentNode;
}

function _getForeContext(node){
 return node.closest('fx-fore');
}

function _getModelInContext(node){
  // const ownerForm = node.closest('fx-fore');
  const ownerForm = _getForeContext(node);
  return ownerForm.getModel();
}

function _getInitialContext(node, ref){
  const parentBind = node.closest('[ref]');

  if (parentBind !== null) {
    return parentBind.nodeset;
  }

  const model = _getModelInContext(node);
  if (XPathUtil.isAbsolutePath(ref)) {
    const instanceId = XPathUtil.getInstanceId(ref);
    return model.getInstance(instanceId).getDefaultContext();
  }
  if (model.getDefaultInstance() !== null) {
    return model.getDefaultInstance().getDefaultContext();
  }
  return [];

}

export default function getInScopeContext(node, ref) {

  const parentElement = _getParentElement(node);
  const repeatItem = parentElement.closest('fx-repeatitem');
  if (repeatItem) {
    return repeatItem.nodeset;
  }

  if(node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('context')){
    const initialContext = _getInitialContext(node.parentNode,ref);
    const contextAttr = node.getAttribute('context');
    return evaluateXPathToFirstNode(contextAttr,initialContext,_getForeContext(parentElement))
  }
  return _getInitialContext(parentElement,ref);
}


