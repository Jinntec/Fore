import { XPathUtil } from './xpath-util.js';

export default function getInScopeContext(node, ref) {
  let resultNodeset;
  let parent;
  if (node.nodeType === Node.ATTRIBUTE_NODE) {
    parent = node.ownerElement;
  } else {
    parent = node.parentNode;
  }

  const repeatItem = parent.closest('fx-repeatitem');
  if (repeatItem) {
    return repeatItem.nodeset;
  }
  const parentBind = parent.closest('[ref]');

  const ownerForm = parent.closest('fx-fore');
  const model = ownerForm.getModel();

  if (parentBind !== null) {
    resultNodeset = parentBind.nodeset;
  } else if (XPathUtil.isAbsolutePath(ref)) {
    const instanceId = XPathUtil.getInstanceId(ref);
    resultNodeset = model.getInstance(instanceId).getDefaultContext();
  } else if (model.getDefaultInstance() !== null) {
    resultNodeset = model.getDefaultInstance().getDefaultContext();
  } else {
    return [];
  }
  // todo: no support for xforms 'context' yet - see https://github.com/betterFORM/betterFORM/blob/02fd3ec595fa275589185658f3011a2e2e826f4d/core/src/main/java/de/betterform/xml/xforms/XFormsElement.java#L451
  return resultNodeset;
}
