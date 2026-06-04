import { Fore } from '../fore.js';

/**
 * <fx-include>
 *
 * Lazy light-DOM include component.
 *
 * Loads markup either from:
 *   - a direct child <template>
 *   - an external HTML document via @src
 *
 * Default behavior:
 *   - listens for an event
 *   - includes content once
 *   - removes the event listener afterwards
 *
 * With @reload:
 *   - listens repeatedly
 *   - clears previously included content
 *   - includes fresh content again
 *
 * Attributes:
 *   event      Event name to listen for. Defaults to "click".
 *   target     CSS selector for the event target. Defaults to "self".
 *              Special values: self, document, window.
 *   src        Optional external HTML source.
 *   selector   Optional selector inside external HTML.
 *   replace    Replace <fx-include> with the included content.
 *   immediate  Include immediately when connected.
 *   reload     Re-include on every matching event.
 */
export class FxInclude extends HTMLElement {
  constructor() {
    super();

    this._listener = this._handleEvent.bind(this);
    this._eventTarget = null;
    this._loaded = false;
    this._replaced = false;
  }

  connectedCallback() {
    this.eventName = this.getAttribute('event') || 'click';
    this.targetSelector = this.getAttribute('target') || 'self';
    this.src = this.getAttribute('src');
    this.selector = this.getAttribute('selector');

    this.replace = this.hasAttribute('replace');
    this.immediate = this.hasAttribute('immediate');
    this.reload = this.hasAttribute('reload');

    if (this.immediate) {
      this.include();
      return;
    }

    this._bindListener();
  }

  disconnectedCallback() {
    this._unbindListener();
  }

  _bindListener() {
    const target = this._resolveEventTarget();

    if (!target) {
      this._dispatchError(`fx-include: event target not found: '${this.targetSelector}'`);
      return;
    }

    target.addEventListener(this.eventName, this._listener);
    this._eventTarget = target;
  }

  _unbindListener() {
    if (this._eventTarget && this._listener) {
      this._eventTarget.removeEventListener(this.eventName, this._listener);
    }

    this._eventTarget = null;
  }

  _resolveEventTarget() {
    if (!this.targetSelector || this.targetSelector === 'self') {
      return this;
    }

    if (this.targetSelector === 'document') {
      return document;
    }

    if (this.targetSelector === 'window') {
      return window;
    }

    const fore = this.closest('fx-fore');

    return fore?.querySelector(this.targetSelector) || document.querySelector(this.targetSelector);
  }

  async _handleEvent(event) {
    await this.include(event);
  }

  async include(triggerEvent = null) {
    if (this._replaced) {
      return;
    }

    if (this._loaded && !this.reload) {
      return;
    }

    const fragment = this.src ? await this._loadExternalFragment() : this._loadTemplateFragment();

    if (!fragment) {
      return;
    }

    if (this.replace) {
      await this._replaceSelf(fragment, triggerEvent);
      return;
    }

    this._clearIncludedContent();

    const wrapper = document.createElement('span');
    wrapper.setAttribute('data-fx-include-content', '');
    wrapper.style.display = 'contents';
    wrapper.appendChild(fragment);

    this.appendChild(wrapper);

    this._loaded = true;

    await this._initializeInsertedContent(wrapper);

    await Fore.dispatch(this, 'include-done', {
      src: this.src || null,
      included: wrapper,
      replaced: false,
      triggerEvent,
    });

    if (!this.reload) {
      this._unbindListener();
    }
  }

  _loadTemplateFragment() {
    const template = this.querySelector(':scope > template');

    if (!template) {
      this._dispatchError('fx-include: no src and no direct template child found');
      return null;
    }

    return template.content.cloneNode(true);
  }

  async _loadExternalFragment() {
    const html = await Fore.loadHtml(this.src);

    if (!html) {
      this._dispatchError(`fx-include: failed to load '${this.src}'`);
      return null;
    }

    const parsed = new DOMParser().parseFromString(html, 'text/html');

    if (this.selector) {
      const selected = parsed.querySelector(this.selector);

      if (!selected) {
        this._dispatchError(`fx-include: selector '${this.selector}' not found in '${this.src}'`);
        return null;
      }

      const fragment = document.createDocumentFragment();
      fragment.appendChild(document.importNode(selected, true));
      return fragment;
    }

    const template = parsed.querySelector('template');

    if (template) {
      return document.importNode(template.content, true);
    }

    const fragment = document.createDocumentFragment();

    Array.from(parsed.body.childNodes).forEach(node => {
      fragment.appendChild(document.importNode(node, true));
    });

    return fragment;
  }

  async _replaceSelf(fragment, triggerEvent) {
    const parent = this.parentNode;

    if (!parent) {
      return;
    }

    const wrapper = document.createElement('span');
    wrapper.setAttribute('data-fx-include-replacement', '');
    wrapper.style.display = 'contents';
    wrapper.appendChild(fragment);

    this._unbindListener();

    this.replaceWith(wrapper);

    this._replaced = true;
    this._loaded = true;

    await this._initializeInsertedContent(wrapper);

    await Fore.dispatch(wrapper, 'include-done', {
      src: this.src || null,
      included: wrapper,
      replaced: true,
      triggerEvent,
    });
  }

  _clearIncludedContent() {
    this.querySelectorAll(':scope > [data-fx-include-content]').forEach(node => {
      node.remove();
    });
  }

  async _initializeInsertedContent(startElement) {
    this._initForeUiDescendants(startElement);
    await Fore.refreshChildren(startElement, true);
  }

  _initForeUiDescendants(startElement) {
    Array.from(startElement.children || []).forEach(element => {
      if (element.nodeName.toUpperCase() === 'FX-FORE') {
        return;
      }

      if (Fore.isUiElement(element.nodeName) && typeof element.init === 'function') {
        element.init();
      }

      this._initForeUiDescendants(element);
    });
  }

  _dispatchError(message) {
    Fore.dispatch(this, 'error', {
      level: 'Error',
      message,
    });
  }
}

if (!customElements.get('fx-include')) {
  customElements.define('fx-include', FxInclude);
}
