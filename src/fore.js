import getInScopeContext from './getInScopeContext.js';
import {
  evaluateXPath,
  evaluateXPathToFirstNode,
  evaluateXPathToString,
  evaluateXPathToNodes,
} from './xpath-evaluation.js';
import { XPathUtil } from './xpath-util.js';

/**
 * Class hosting common utility functions used throughout all fore elements
 *
 * @example ../doc/demo.html
 */
export class Fore {
  static READONLY_DEFAULT = false;

  static REQUIRED_DEFAULT = false;

  static RELEVANT_DEFAULT = true;

  static CONSTRAINT_DEFAULT = true;

  static TYPE_DEFAULT = 'xs:string';

  /**
   * Loads and return a piece of HTML
   * @param url {String} - the Url to load from
   * @returns {Promise<string>}
   */
  static async loadHtml(url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'text/html',
        },
      });
      const responseContentType = response.headers.get('content-type').toLowerCase();
      if (responseContentType.startsWith('text/html')) {
        return response.text();
      }
      Fore.dispatch(this, 'error', {
        message: `Response has wrong contentType '${responseContentType}'. Should be 'text/html'`,
        level: 'Error',
      });
    } catch (e) {
      Fore.dispatch(this, 'error', {
        message: `Html couldn't be loaded from '${url}'`,
        level: 'Error',
      });
    }
  }

  /**
   * loads a Fore element from given `src`. Always returns the first occurrence of a `<fx-fore>`. The retured element
   * will replace the `replace` element in the DOM.
   *
   * @param {string} replace the element with a `src` attribute to resolvé.
   * @param {string} src the Url to resolve
   * @param {string} selector a querySelector expression to fetch certain element from loaded document
   * @returns {Promise<void>}
   */
  static async loadForeFromSrc(replace, src, selector) {
    if (!src) {
      Fore.dispatch(this, 'error', {
        detail: {
          message: "No 'src' attribute present",
        },
      });
    }
    await Fore.loadHtml(src).then((data) => {
      const parsed = new DOMParser().parseFromString(data, 'text/html');
      // const theFore = parsed.querySelector('fx-fore');
      const foreElement = parsed.querySelector(selector);
      // console.log('foreElement', foreElement)
      if (!foreElement) {
        Fore.dispatch(this, 'error', {
          detail: {
            message: `Fore element not found in '${src}'. Maybe wrapped within 'template' element?`,
          },
        });
      }
      foreElement.setAttribute('from-src', src);
      const thisAttrs = replace.attributes;
      Array.from(thisAttrs).forEach((attr) => {
        if (attr.name !== 'src') {
          foreElement.setAttribute(attr.name, attr.value);
        }
      });
      replace.replaceWith(foreElement);
      return foreElement;
    });
  }

  /**
   * Builds a predicate string that identifies this node.
   * @todo Likely unused
   * @param  {Node} node
   */
  static buildPredicates(node) {
    let attrPredicate = '';
    Array.from(node.attributes).forEach((attr) => {
      // attrMap.set(attr.nodeName,attr.nodeValue);
      // if(attr.nodeName !== 'xmlns'){
      //   if(attr.nodeValue !== ''){
      //     attrPredicate += `[@${attr.nodeName}='${attr.nodeValue}']`;
      //   }else{
      attrPredicate += `[@${attr.nodeName}]`;
      // }
      // }
    });
    return attrPredicate;
  }

  /**
   * returns true if target element is the widget itself or some element within the widget.
   * @param {HTMLElement} target an event target
   * @returns {boolean}
   */
  static isWidget(target) {
    if (target?.classList.contains('widget')) return true;
    let parent = target.parentNode;
    while (parent && parent.nodeName !== 'FX-CONTROL') {
      if (parent?.classList?.contains('widget')) return true;
      parent = parent.parentNode;
    }
    return false;
  }

  /**
   * Get a string that can be used as a path to a node
   *
   * @param {Node} node
   * @returns {string}
   */
  static getDomNodeIndexString(node) {
    const indexes = [];
    let currentNode = node;

    while (currentNode && currentNode.parentNode) {
      const parent = currentNode.parentNode;
      if (parent.childNodes && parent.childNodes.length > 0) {
        const index = [...parent.childNodes].indexOf(currentNode);
        indexes.unshift(index);
      }
      currentNode = parent;
    }

    return indexes.join('.');
  }

  /**
   * Get the expression part of something
   * @param {string} input
   * @returns {string}
   */
  static getExpression(input) {
    if (input.startsWith('{') && input.endsWith('}')) {
      return input.substring(1, input.length - 1);
    }
    return input;
  }

  /**
   * returns the next `fx-fore` element upwards in tree
   *
   * @param {HTMLElement|Text} start
   * @returns {import('./fx-fore.js').FxFore}
   */
  static getFore(start) {
    return start.nodeType === Node.TEXT_NODE
      ? start.parentNode.closest('fx-fore')
      : start.closest('fx-fore');
  }

  static get ACTION_ELEMENTS() {
    return [
      'FX-ACTION',
      'FX-DELETE',
      'FX-DISPATCH',
      'FX-HIDE',
      'FX-INSERT',
      'FX-LOAD',
      'FX-MESSAGE',
      'FX-REBUILD',
      'FX-RECALCULATE',
      'FX-REFRESH',
      'FX-RENEW',
      'FX-RELOAD',
      'FX-REPLACE',
      'FX-RESET',
      'FX-RETAIN',
      'FX-RETURN',
      'FX-REVALIDATE',
      'FX-SEND',
      'FX-SETFOCUS',
      'FX-SETINDEX',
      'FX-SETVALUE',
      'FX-SHOW',
      'FX-TOGGLE',
      'FX-UPDATE',
    ];
  }

  static createUUID() {
    // http://www.ietf.org/rfc/rfc4122.txt
    const s = [];
    const hexDigits = '0123456789abcdef';
    for (let i = 0; i < 36; i += 1) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = '-';

    const uuid = s.join('');
    return uuid;
  }

  static get XFORMS_NAMESPACE_URI() {
    // todo: should be centralized somewhere as constant. Exists in several? places
    return 'http://www.w3.org/2002/xforms';
  }

  /**
   * @param {string} elementName
   * @returns {boolean}
   */
  static isActionElement(elementName) {
    return Fore.ACTION_ELEMENTS.includes(elementName);
  }

  static get UI_ELEMENTS() {
    return [
      'FX-ALERT',
      'FX-CONTROL',
      'FX-DIALOG',
      'FX-FILENAME',
      'FX-MEDIATYPE',
      'FX-GROUP',
      'FX-HINT',
      'FX-ITEMS',
      'FX-OUTPUT',
      'FX-RANGE',
      'FX-REPEAT',
      'FX-REPEATITEM',
      'FX-REPEAT-ATTRIBUTES',
      'FX-SWITCH',
      'FX-SECRET',
      'FX-SELECT',
      'FX-SUBMIT',
      'FX-TEXTAREA',
      'FX-TRIGGER',
      'FX-UPLOAD',
      'FX-VAR',
    ];
  }

  static get MODEL_ELEMENTS() {
    return ['FX-BIND', 'FX-FUNCTION', 'FX-MODEL', 'FX-INSTANCE', 'FX-SUBMISSION'];
  }

  /**
   * @param {string} elementName
   * @returns {boolean}
   */
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
   * @param {HTMLElement} startElement
   * @param {boolean} force
   * @returns {Promise<void>}
   */
  static async refreshChildren(startElement, force) {
    const refreshed = new Promise((resolve) => {
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
        Array.from(children).forEach((element) => {
          if (element.nodeName.toUpperCase() === 'FX-FORE') {
            resolve('done');
            return;
          }
          if (Fore.isUiElement(element.nodeName) && typeof element.refresh === 'function') {
            // console.log('refreshing', element, element?.ref);
            // console.log('refreshing ',element);
            element.refresh(force);
          } else if (element.nodeName.toUpperCase() !== 'FX-MODEL') {
            Fore.refreshChildren(element, force);
          }
        });
      }
      resolve('done');
    });

    return refreshed;
  }

  static copyDom(inputElement) {
    console.time('convert');
    const target = new DOMParser().parseFromString('<fx-fore></fx-fore>', 'text/html');
    console.log('copyDom new doc', target);
    console.log('copyDom new body', target.body);
    console.log('copyDom new body', target.querySelector('fx-fore'));
    const newFore = target.querySelector('fx-fore');
    this.convertFromSimple(inputElement, newFore);
    newFore.removeAttribute('convert');
    console.log('converted', newFore);
    console.timeEnd('convert');
    return newFore;
  }

  static convertFromSimple(startElement, targetElement) {
    const children = startElement.childNodes;
    if (children) {
      Array.from(children).forEach((node) => {
        const lookFor = `FX-${node.nodeName.toUpperCase()}`;
        if (
          Fore.MODEL_ELEMENTS.includes(lookFor)
          || Fore.UI_ELEMENTS.includes(lookFor)
          || Fore.ACTION_ELEMENTS.includes(lookFor)
        ) {
          const conv = targetElement.ownerDocument.createElement(lookFor);
          console.log('conv', node, conv);
          targetElement.appendChild(conv);
          Fore.copyAttributes(node, conv);
          Fore.convertFromSimple(node, conv);
        } else {
          if (node.nodeType === Node.TEXT_NODE) {
            const copied = targetElement.ownerDocument.createTextNode(node.textContent);
            targetElement.appendChild(copied);
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            const copied = targetElement.ownerDocument.createElement(node.nodeName);
            targetElement.appendChild(copied);
            Fore.copyAttributes(node, targetElement);
            Fore.convertFromSimple(node, copied);
          }
        }
      });
    }
  }

  static copyAttributes(source, target) {
    return Array.from(source.attributes).forEach((attribute) => {
      target.setAttribute(attribute.nodeName, attribute.nodeValue);
    });
  }

  /**
   * returns the proper content-type for instance.
   *
   * @param instance an fx-instance element
   * @param contentType - the contentType
   * @returns {string|null}
   */
  static getContentType(instance, contentType) {
    if (contentType === 'application/x-www-form-urlencoded') {
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

  static async handleResponse(response) {
    const { status } = response;
    if (status >= 400) {
      // console.log('response status', status);
      alert(`response status:  ${status} - failed to load data for '${this.src}' - stopping.`);
      throw new Error(`failed to load data - status: ${status}`);
    }
    const responseContentType = response.headers.get('content-type').toLowerCase();
    // console.log('********** responseContentType *********', responseContentType);
    if (responseContentType.startsWith('text/html')) {
      // const htmlResponse = response.text();
      // return new DOMParser().parseFromString(htmlResponse, 'text/html');
      // return response.text();
      return response.text().then(result =>
        // console.log('xml ********', result);
        new DOMParser().parseFromString(result, 'text/html'));
    }
    if (
      responseContentType.startsWith('text/plain')
      || responseContentType.startsWith('text/markdown')
    ) {
      // console.log("********** inside  res plain *********");
      return response.text();
    }
    if (responseContentType.startsWith('application/json')) {
      // console.log("********** inside res json *********");
      return response.json();
    }
    if (responseContentType.startsWith('application/xml')) {
      const text = await response.text();
      // console.log('xml ********', result);
      return new DOMParser().parseFromString(text, 'application/xml');
    }
    return 'done';
  }

  /*
  static evaluateAttributeTemplateExpression(expr, node) {
    const matches = expr.match(/{[^}]*}/g);
    if (matches) {
      matches.forEach(match => {
        console.log('match ', match);
        const naked = match.substring(1, match.length - 1);
        const inscope = getInScopeContext(node, naked);
        const result = evaluateXPathToString(naked, inscope, node.getOwnerForm());
        const replaced = expr.replaceAll(match, result);
        console.log('replacing ', expr, ' with ', replaced);
        expr = replaced;
      });
    }
    return expr;
  }
*/

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

  static fadeOutElement(element, duration) {
    // const duration = duration;
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

  static async dispatch(target, eventName, detail) {
    if (!XPathUtil.contains(target?.ownerDocument, target)) {
      // The target is gone from the document. This happens when we are done with a refresh that removed the component
      return;
    }
    const event = new CustomEvent(eventName, {
      composed: false,
      bubbles: true,
      detail,
    });
    event.listenerPromises = [];

    target.dispatchEvent(event);

    // By now, all listeners for the event should have registered their completion promises to us.
    if (event.listenerPromises.length) {
      await Promise.all(event.listenerPromises);
    }
    // console.log('!!! DISPATCH_DONE', eventName);
  }

  static formatXml(xml) {
    const reg = /(>)(<)(\/*)/g;
    const wsexp = / *(.*) +\n/g;
    const contexp = /(<.+>)(.+\n)/g;
    xml = xml
      .replace(reg, '$1\n$2$3')
      .replace(wsexp, '$1\n')
      .replace(contexp, '$1\n$2');
    let formatted = '';
    const lines = xml.split('\n');
    let indent = 0;
    let lastType = 'other';
    // 4 types of tags - single, closing, opening, other (text, doctype, comment) - 4*4 = 16 transitions
    const transitions = {
      'single->single': 0,
      'single->closing': -1,
      'single->opening': 0,
      'single->other': 0,
      'closing->single': 0,
      'closing->closing': -1,
      'closing->opening': 0,
      'closing->other': 0,
      'opening->single': 1,
      'opening->closing': 0,
      'opening->opening': 1,
      'opening->other': 1,
      'other->single': 0,
      'other->closing': -1,
      'other->opening': 0,
      'other->other': 0,
    };

    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      const single = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
      const closing = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
      const opening = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
      const type = single ? 'single' : closing ? 'closing' : opening ? 'opening' : 'other';
      const fromTo = `${lastType}->${type}`;
      lastType = type;
      let padding = '';

      indent += transitions[fromTo];
      for (let j = 0; j < indent; j++) {
        padding += '    ';
      }

      formatted += `${padding + ln}\n`;
    }
  }

  static stringifiedComponent(element) {
    return `<${element.localName} ${Array.from(element.attributes)
      .map(attr => `${attr.name}="${attr.value}"`)
      .join(' ')}>…</${element.localName}>`;
  }
  /*
  static async loadForeFromUrl(hostElement, url) {
    // console.log('########## loading Fore from ', this.src, '##########');
    await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'text/html',
      },
    })
      .then(response => {
        const responseContentType = response.headers.get('content-type').toLowerCase();
        console.log('********** responseContentType *********', responseContentType);
        if (responseContentType.startsWith('text/html')) {
          return response.text().then(result =>
            // console.log('xml ********', result);
            new DOMParser().parseFromString(result, 'text/html'),
          );
        }
        return 'done';
      })
      .then(data => {
        // const theFore = fxEvaluateXPathToFirstNode('//fx-fore', data.firstElementChild);
        const theFore = data.querySelector('fx-fore');
        // console.log('thefore', theFore)
        if (!theFore) {
          hostElement.dispatchEvent(
            new CustomEvent('error', {
              composed: false,
              bubbles: true,
              detail: {
                message: 'cyclic graph',
              },
            }),
          );
        }
        const imported = document.importNode(theFore,true);
        console.log(`########## loaded fore as component ##### ${hostElement.url}`);
        imported.addEventListener(
            'model-construct-done',
            e => {
              // console.log('subcomponent ready', e.target);
              const defaultInst = imported.querySelector('fx-instance');
              // console.log('defaultInst', defaultInst);
              if(hostElement.initialNode){
                const doc = new DOMParser().parseFromString('<data></data>', 'application/xml');
                // Note: Clone the input to prevent the inner fore from editing the outer node
                doc.firstElementChild.appendChild(hostElement.initialNode.cloneNode(true));
                // defaultinst.setInstanceData(this.initialNode);
                defaultInst.setInstanceData(doc);
              }
              // console.log('new data', defaultInst.getInstanceData());
              // theFore.getModel().modelConstruct();
              imported.getModel().updateModel();
              imported.refresh();
              return 'done';

            },
            { once: true },
        );

        const dummy = hostElement.querySelector('input');
        if (hostElement.hasAttribute('shadow')) {
          dummy.parentNode.removeChild(dummy);
          hostElement.shadowRoot.appendChild(imported);
        } else {
          // console.log(this, 'replacing widget with',theFore);
          dummy.replaceWith(imported);
          // this.appendChild(imported);
        }
      })
      /!*.catch(error => {
        hostElement.dispatchEvent(
          new CustomEvent('error', {
            composed: false,
            bubbles: true,
            detail: {
              error: error,
              message: `'${url}' not found or does not contain Fore element.`,
            },
          }),
        );
      });*!/
  }
*/

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
