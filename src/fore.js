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
      'FX-UPDATE',
    ];
  }

  static get XFORMS_NAMESPACE_URI() {
    // todo: should be centralized somewhere as constant. Exists in several? places
    return 'http://www.w3.org/2002/xforms';
  }

  static isActionElement(elementName) {
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

  static async refreshChildren(startElement) {
    const refreshed = new Promise(resolve => {
      const { children } = startElement;
      if (children) {
        Array.from(children).forEach(element => {
          if (Fore.isUiElement(element.nodeName) && typeof element.refresh === 'function') {
            element.refresh();
          } else if (element.nodeName.toUpperCase() !== 'FX-MODEL') {
            Fore.refreshChildren(element);
          }
        });
      }
      resolve('done');
    });

    return refreshed;
  }

  static isRepeated(element) {
    return element.closest('fx-repeatitem') !== null;
  }

  static getRepeatTarget(element, id) {
    const repeatContextItem = element.closest('fx-repeatitem');
    const target = repeatContextItem.querySelector(`#${id}`);
    return target;
  }

  /**
   * returns the proper content-type for instance.
   *
   * @param instance an fx-instance element
   * @returns {string|null}
   */
  static getContentType(instance, method) {
    if (method === 'urlencoded-post') {
      return 'application/x-www-form-urlencoded; charset=UTF-8';
    }
    if (instance.type === 'xml') {
      return 'application/xml; charset=UTF-8';
    }
    if (instance.type === 'json') {
      return 'application/json';
    }
    console.warn('content-type unknown ', instance.type);
    return null;
  }

  static fadeInElement(element){
    const duration = 600;
    const fadeIn = () => {
      // Stop all current animations
      if (element.getAnimations) {
        element.getAnimations().map((anim) => anim.finish());
      }

      // Play the animation with the newly specified duration
       const fadeIn = element.animate({
        opacity: [0, 1]
      }, duration);
      return fadeIn.finished;
    };
    return fadeIn();
  }

  static fadeOutElement(element){
    const duration = 2600;
    const fadeOut = () => {
      // Stop all current animations
      if (element.getAnimations) {
        element.getAnimations().map((anim) => anim.finish());
      }

      // Play the animation with the newly specified duration
       const fadeOut = element.animate({
        opacity: [1, 0]
      }, duration);
      return fadeOut.finished;
    };
    return fadeOut();
  }

  /**
   * clear all text nodes and attribute values to get a 'clean' template.
   * @param n
   * @private
   */
  /*
    static clear(n) {
      n.textContent = '';
      if (n.hasAttributes()) {
        const attrs = n.attributes;
        for (let i = 0; i < attrs.length; i+= 1) {
          attrs[i].value = '';
        }
      }
      const { children } = n;
      for (let i = 0; i < children.length; i+= 1) {
        Fore.clear(children[i]);
      }
    }
  */
}
