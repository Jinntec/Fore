import ForeElementMixin from '../ForeElementMixin.js';
import registerFunction from './registerFunction.js';

const LOCAL_FUNCTIONS_NS = 'http://www.w3.org/2005/xquery-local-functions';

// Global per-page cache to prevent registering the same library multiple times.
// Keyed by resolved URL + prefix + mode.
const _functionLibLoadCache = new Map();

// registerFunction() enforces "first wins" for conflicting names, but library sources
// (module imports, fetches) resolve asynchronously in whatever order the network/parser
// finishes them in. To make "first" mean "first in document order" (deterministic, and
// independent of load timing) rather than "first promise to resolve" (racy), every real
// loader reserves its turn synchronously in connectedCallback -- before any await -- and
// only applies its registrations once all earlier-reserved loaders have applied theirs.
let _registrationOrderChain = Promise.resolve();

function _reserveRegistrationTurn() {
  const waitForTurn = _registrationOrderChain;
  let releaseTurn;
  _registrationOrderChain = new Promise(resolve => {
    releaseTurn = resolve;
  });
  return { waitForTurn, releaseTurn };
}

function looksLikeModuleSrc(src) {
  return /\.m?js($|\?)/i.test(src);
}

function applyPrefixToSignature(signature, prefix) {
  if (!signature || !prefix) return signature;

  const s = signature.trim();
  const paren = s.indexOf('(');
  if (paren < 0) return s;

  const namePart = s.slice(0, paren).trim();
  const rest = s.slice(paren);

  const localName = namePart.includes(':') ? namePart.split(':').pop().trim() : namePart;
  if (!localName) return s;

  return `${prefix}:${localName}${rest}`;
}

function normalizeModuleExportToList(mod, src) {
  const lib = mod.functions ?? mod.fxFunctions;
  if (!lib) {
    console.error(
      `fx-functionlib: Module ${src} must export a named \`functions\` (or \`fxFunctions\`).`,
    );
    return [];
  }
  if (Array.isArray(lib)) return lib;
  if (typeof lib === 'object') return Object.values(lib);
  return [];
}

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
    if (!src) {
      console.error('fx-functionlib: Missing required @src.');
      this._resolveLoading(undefined);
      return;
    }

    const prefix = (this.getAttribute('prefix') || '').trim();

    const typeAttr = (this.getAttribute('type') || '').trim().toLowerCase();
    const isModule = typeAttr === 'module' || (!typeAttr && looksLikeModuleSrc(src));

    const resolvedUrl = new URL(src, this.baseURI).href;

    if (prefix) this._ensurePrefixDeclared(prefix);

    const mode = isModule ? 'module' : 'html';
    const cacheKey = `${mode}|${resolvedUrl}|${prefix}`;

    const existing = _functionLibLoadCache.get(cacheKey);
    if (existing) {
      try {
        await existing;
      } finally {
        this._resolveLoading(undefined);
      }
      return;
    }

    // Reserve our place in the registration order now, synchronously, so it reflects
    // document order rather than whichever loader's fetch/import happens to finish first.
    const { waitForTurn, releaseTurn } = _reserveRegistrationTurn();

    const loadPromise = (async () => {
      try {
        if (isModule) {
          await this._loadModuleLibrary(resolvedUrl, src, prefix, waitForTurn);
        } else {
          await this._loadHtmlLibrary(resolvedUrl, src, prefix, waitForTurn);
        }
      } finally {
        releaseTurn();
      }
    })();

    _functionLibLoadCache.set(cacheKey, loadPromise);

    try {
      await loadPromise;
    } catch (e) {
      _functionLibLoadCache.delete(cacheKey);
      console.error(`fx-functionlib: Loading function library at ${src} failed.`, e);
    } finally {
      this._resolveLoading(undefined);
    }
  }

  _ensurePrefixDeclared(prefix) {
    const ownerForm =
        (typeof this.getOwnerForm === 'function' && this.getOwnerForm()) || this.closest('fx-fore');

    if (!ownerForm) return;

    const attrName = `xmlns:${prefix}`;
    if (!ownerForm.getAttribute(attrName)) {
      ownerForm.setAttribute(attrName, LOCAL_FUNCTIONS_NS);
    }
  }

  _register(functionObject, prefix) {
    if (!functionObject || typeof functionObject.signature !== 'string') return;

    // If prefix is given: register ONLY the prefixed signature (no unprefixed alias).
    const sig = prefix
        ? applyPrefixToSignature(functionObject.signature, prefix)
        : functionObject.signature;

    registerFunction({ ...functionObject, signature: sig }, this);
  }

  async _loadModuleLibrary(resolvedUrl, src, prefix, waitForTurn) {
    const mod = await import(/* @vite-ignore */ resolvedUrl);

    const items = normalizeModuleExportToList(mod, src);

    await waitForTurn;

    for (const item of items) {
      if (typeof item === 'function') {
        const { signature } = item;
        if (typeof signature !== 'string' || !signature.trim()) continue;

        this._register(
            {
              type: 'text/javascript',
              signature: signature.trim(),
              implementation: item,
            },
            prefix,
        );
      } else if (item && typeof item === 'object' && typeof item.signature === 'string') {
        this._register(item, prefix);
      }
    }
  }

  async _loadHtmlLibrary(resolvedUrl, src, prefix, waitForTurn) {
    const result = await fetch(resolvedUrl);
    if (!result.ok) {
      console.error(`Loading function library at ${src} failed.`);
      return;
    }

    const body = await result.text();
    const document = new DOMParser().parseFromString(body, 'text/html');

    const functions = Array.from(document.querySelectorAll('fx-function'));

    await waitForTurn;

    for (const func of functions) {
      const functionObject = {
        type: func.getAttribute('type'),
        signature: func.getAttribute('signature'),
        functionBody: func.innerText,
      };

      this._register(functionObject, prefix);
    }
  }
}

if (!customElements.get('fx-functionlib')) {
  customElements.define('fx-functionlib', FxFunctionlib);
}