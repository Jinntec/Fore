import ForeElementMixin from '../ForeElementMixin.js';
import registerFunction from './registerFunction.js';

/**
 * Allows to extend a form with remote custom functions.
 *
 */
export class FxFunctionlib extends ForeElementMixin {
  constructor() {
    super();

    /**
     * @type {Function}
     */
    this._resolve = null;

    /**
     * @type {Promise<undefined>}
     */
    this.readyPromise = new Promise(resolve => (this._resolveLoading = resolve));
  }

  async connectedCallback() {
    this.style.display = 'none';

    const src = this.getAttribute('src');

    const result = await fetch(src);
    if (!result.ok) {
      console.error(`Loading function library at ${src} failed.`);
    }

    const body = await result.text();
    const document = new DOMParser().parseFromString(body, 'text/html');

    /**
     * @type {HTMLElement[]}
     */
    const functions = Array.from(document.querySelectorAll('fx-function'));
    // TODO: also recurse into new function libraries here?
    for (const func of functions) {
      const functionObject = {
        type: func.getAttribute('type'),
        signature: func.getAttribute('signature'),
        functionBody: func.innerText,
      };

      registerFunction(functionObject, this);
    }
    this._resolveLoading(undefined);
  }
}

if (!customElements.get('fx-functionlib')) {
  customElements.define('fx-functionlib', FxFunctionlib);
}
