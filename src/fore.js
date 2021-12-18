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

  static createUUID() {
    // http://www.ietf.org/rfc/rfc4122.txt
    const s = [];
    const hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    const uuid = s.join("");
    return uuid;
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
      'FX-ITEMS',
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

  /**
   * recursively refreshes all UI Elements.
   *
   * todo: this could probably made more efficient with significant impact on rendering perf
   *
   * @param startElement
   * @param force
   * @returns {Promise<unknown>}
   */
  static async refreshChildren(startElement,force) {
    const refreshed = new Promise(resolve => {
      /*
      if there's an 'refresh-on-view' attribute the element wants to be handled by
      handleIntersect function that calls the refresh of the respective element and
      not the global one.
       */
      // if(!force && startElement.hasAttribute('refresh-on-view')) return;

/*  ### attempt with querySelectorAll is even slower than iterating recursively

      const children = startElement.querySelectorAll('[ref]');
      Array.from(children).forEach(uiElement => {
        if (Fore.isUiElement(uiElement.nodeName) && typeof uiElement.refresh === 'function') {
          uiElement.refresh();
        }
      });
*/
      const { children } = startElement;
      if (children) {
        Array.from(children).forEach(element => {
          if (Fore.isUiElement(element.nodeName) && typeof element.refresh === 'function') {
            element.refresh();
          } else if (element.nodeName.toUpperCase() !== 'FX-MODEL') {
            Fore.refreshChildren(element,force);
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

  static fadeInElement(element) {
    const duration = 600;
    let fadeIn = () => {
      // Stop all current animations
      if (element.getAnimations) {
        element.getAnimations().map(anim => anim.finish());
      }

      // Play the animation with the newly specified duration
      fadeIn = element.animate(
        {
          opacity: [0, 1],
        },
        duration,
      );
      return fadeIn.finished;
    };
    return fadeIn();
  }

  static fadeOutElement(element) {
    const duration = 2600;
    let fadeOut = () => {
      // Stop all current animations
      if (element.getAnimations) {
        element.getAnimations().map(anim => anim.finish());
      }

      // Play the animation with the newly specified duration
      fadeOut = element.animate(
        {
          opacity: [1, 0],
        },
        duration,
      );
      return fadeOut.finished;
    };
    return fadeOut();
  }

  static dispatch(target, eventName, detail) {
    const event = new CustomEvent(eventName, {
      composed: true,
      bubbles: true,
      detail,
    });
    console.log('firing', event);
    target.dispatchEvent(event);
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
