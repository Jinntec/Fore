import * as fx from 'fontoxpath';
import { XPathUtil } from './xpath-util';

export class Fore {
  static READONLY_DEFAULT = false;

  static REQUIRED_DEFAULT = false;

  static RELEVANT_DEFAULT = true;

  static CONSTRAINT_DEFAULT = true;

  static TYPE_DEFAULT = 'xs:string';

  static get ACTION_ELEMENTS() {
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
      xhtml: 'http://www.w3.org/1999/xhtml',
      // ''    : Fore.XFORMS_NAMESPACE_URI
    };
    return ns[prefix] || null;
  }

  static get XFORMS_NAMESPACE_URI() {
    return XFORMS_NAMESPACE_URI;
  }

  static isActionElement(elementName) {
    const found = Fore.ACTION_ELEMENTS.includes(elementName);
    // console.log('isActionElement ', found);
    return Fore.ACTION_ELEMENTS.includes(elementName);
  }

  static get UI_ELEMENTS() {
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
      'FX-UPLOAD',
    ];
  }

  static isUiElement(elementName) {
    const found = Fore.UI_ELEMENTS.includes(elementName);
    if (found) {
      // console.log('_isUiElement ', found);
    }
    return Fore.UI_ELEMENTS.includes(elementName);
  }

  // static async refreshChildren(startElement){
  static async refreshChildren(startElement) {
    const refreshed = new Promise((resolve, reject) => {
      const { children } = startElement;
      if (children) {
        Array.from(children).forEach(element => {
          // todo: later - check for AVTs
          if (Fore.isUiElement(element.nodeName) && typeof element.refresh === 'function') {
            element.refresh();
          } else if (element.nodeName !== 'fx-MODEL') {
            Fore.refreshChildren(element);
          }
        });
      }
      resolve('done');
    });

    return refreshed;
  }

  /**
   * clear all text nodes and attribute values to get a 'clean' template.
   * @param n
   * @private
   */
  static clear(n) {
    n.textContent = '';
    if (n.hasAttributes()) {
      const attrs = n.attributes;
      for (let i = 0; i < attrs.length; i++) {
        attrs[i].value = '';
      }
    }
    const { children } = n;
    for (let i = 0; i < children.length; i++) {
      Fore.clear(children[i]);
    }
  }
}
