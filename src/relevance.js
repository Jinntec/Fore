import { Fore } from './fore.js';

export class Relevance {
  static handleRelevance(boundElement) {
    const modelItem = boundElement.getModelItem();

    if (modelItem && modelItem.relevant) {
      boundElement.removeAttribute('nonrelevant');
      boundElement.setAttribute('relevant', '');
      Fore.dispatch(this, 'relevant', {});
    } else {
      boundElement.removeAttribute('relevant');
      boundElement.setAttribute('nonrelevant', '');
      Fore.dispatch(this, 'nonrelevant', {});
    }
  }

  static selectRelevant(element, type) {
    // console.log('selectRelevant', type);
    switch (type) {
      case 'xml':
        return Relevance._relevantXmlNodes(element);
      default:
        console.warn(`relevance selection not supported for type:${element.type}`);
        return element.nodeset;
    }
  }

  static _relevantXmlNodes(element) {
    // ### no relevance selection - current nodeset is used 'as-is'
    const nonrelevant = element.getAttribute('nonrelevant');
    if (nonrelevant === 'keep') {
      return element.nodeset;
    }

    // first check if nodeset of submission is relevant - otherwise bail out
    const mi = element.getModel().getModelItem(element.nodeset);
    if (mi && !mi.relevant) return null;

    const root = element.nodeset.cloneNode(false);

    if (element.nodeset.children.length === 0 && Relevance._isRelevant(element, element.nodeset)) {
      return element.nodeset;
    }
    return Relevance._filterRelevant(element, element.nodeset, root);
  }

  static _filterRelevant(element, node, result) {
    const { childNodes } = node;
    Array.from(childNodes).forEach(n => {
      if (Relevance._isRelevant(element, n)) {
        const clone = n.cloneNode(false);
        result.appendChild(clone);
        const { attributes } = n;
        if (attributes) {
          Array.from(attributes).forEach(attr => {
            if (element.nonrelevant === 'empty' && !Relevance._isRelevant(element, attr)) {
              clone.setAttribute(attr.nodeName, '');
            } else if (Relevance._isRelevant(element, attr)) {
              clone.setAttribute(attr.nodeName, attr.value);
            } else {
              // if (element.nonrelevant === 'empty') {
              //   clone.setAttribute(attr.nodeName, '');
              // } else{
              clone.removeAttribute(attr.nodeName);
              // }
            }
            /*
            if (Relevance._isRelevant(element, attr)) {
              clone.setAttribute(attr.nodeName, attr.value);
            } else if (element.nonrelevant === 'empty') {
              clone.setAttribute(attr.nodeName, '');
            } else {
              clone.removeAttribute(attr.nodeName);
            }
*/
          });
        }
        return Relevance._filterRelevant(element, n, clone);
      }
      return null;
    });
    return result;
  }

  static _isRelevant(element, node) {
    const mi = element.getModel().getModelItem(node);

    // ### remove empty attributes as these usually are not expected in most XML languages.
    if (node.nodeType === Node.ATTRIBUTE_NODE && node.nodeValue === '') {
      return false;
    }
    // ### no modelItem means no constraints
    if (!mi) {
      return true;
    }
    // ### modelItem 'relevant' is defined and 'true'
    if (mi.relevant) {
      return true;
    }

    return false;
  }
}
