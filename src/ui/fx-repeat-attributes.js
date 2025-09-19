import { Fore } from '../fore.js';
import { evaluateXPath } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
import { XPathUtil } from '../xpath-util.js';
import { withDraggability } from '../withDraggability.js';
import { getPath } from '../xpath-path.js';
import { RepeatBase } from './repeat-base.js';

/**
 * `fx-repeat`
 *
 * Repeats its template for each node in its' bound nodeset.
 *
 * Template is a standard HTML `<template>` element. Once instanciated the template
 * is moved to the shadowDOM of the repeat for safe re-use.
 *
 *
 *
 * @customElement
 * @demo demo/todo.html
 *
 * todo: it should be seriously be considered to extend FxContainer instead but needs refactoring first.
 */
export class FxRepeatAttributes extends withDraggability(RepeatBase, false) {
  static get properties() {
    return {
      ...super.properties,
      index: {
        type: Number,
      },
      template: {
        type: Object,
      },
      focusOnCreate: {
        type: String,
      },
      initDone: {
        type: Boolean,
      },
      repeatIndex: {
        type: Number,
      },
      repeatSize: {
        type: Number,
      },
      nodeset: {
        type: Array,
      },
    };
  }

  constructor() {
    super();
    this.ref = '';
    this.dataTemplate = [];
    this.isDraggable = null;
    this.focusOnCreate = '';
    this.initDone = false;
    this.repeatIndex = 1;
    this.nodeset = [];
    this.inited = false;
    this.host = {};
    this.index = 1;
    this.repeatSize = 0;
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    /**
     * @type {Map<Element, Node>} A lookup from a repeat item to the node it has associated
     */
    this._contextItemByRepeatItem = new Map();
  }

  /**
   * Get the context node for the given repeat item
   *
   * @param {Element} repeatItem
   * @returns {Node} The node (if any) that is the active item for this repeat item
   */
  getContextForRepeatItem(repeatItem) {
    return this._contextItemByRepeatItem.get(repeatItem);
  }

  /*
  get repeatSize() {
    return this.querySelectorAll(':scope > .fx-repeatitem').length;
  }

  set repeatSize(size) {
    super.repeatSize = size;
  }
*/

  async init() {
    // ### there must be a single 'template' child

    const inited = new Promise(resolve => {
      // console.log('##### repeat-attributes init ', this.id);
      // if(!this.inited) this.init();
      // does not use this.evalInContext as it is expecting a nodeset instead of single node
      this._evalNodeset();
      // console.log('##### ',this.id, this.nodeset);

      this._initTemplate();
      // this._initRepeatItems();

      this.setAttribute('index', this.index);
      this.inited = true;
      resolve('done');
    });

    return inited;
  }

  _deleteHandler(deleted) {
    super._deleteHandler(deleted);
    const refd = this.querySelector('[data-ref]');
    const rItems = refd ? refd.querySelectorAll(':scope > .fx-repeatitem') : [];

    for (let i = 0; i < Math.min(this.nodeset.length, rItems.length); ++i) {
      this._contextItemByRepeatItem.set(rItems[i], this.nodeset[i]);
    }
  }

  setIndex(index) {
    const refd = this.querySelector('[data-ref]');
    const rItems = refd ? refd.querySelectorAll(':scope > .fx-repeatitem') : [];
    const size = rItems.length;

    const clamped = size === 0 ? 0 : Math.max(1, Math.min(index, size));
    this.index = clamped;

    if (size > 0) {
      this.applyIndex(rItems[this.index - 1]);
    } else {
      this._removeIndexMarker(); // nothing selected
    }

    this.setAttribute('index', String(this.index));
  }

  /*
  applyIndex(repeatItem) {
    this._removeIndexMarker();
    if (repeatItem) {
      repeatItem.setAttribute('repeat-index', '');
    }
  }
*/

  /*
  get index() {
    return parseInt(this.getAttribute('index'), 10);
  }

  set index(idx) {
    this.setAttribute('index', idx);
  }
*/

  _getRepeatedItems() {
    const refd = this.querySelector('[data-ref]');
    return refd.children;
  }

  async connectedCallback() {
    super.connectedCallback();
    // console.log('connectedCallback',this);
    // this.display = window.getComputedStyle(this, null).getPropertyValue("display");
    this.ref = this.getAttribute('ref');
    // this.ref = this._getRef();
    // console.log('### fx-repeat connected ', this.id);
    this.addEventListener('item-changed', e => {
      // console.log('handle index event ', e);
      const { item } = e.detail;
      const repeatedItems = this._getRepeatedItems();
      const idx = Array.from(repeatedItems).indexOf(item);
      this.setIndex(idx + 1);
      // this.applyIndex(repeatedItems[idx]);
      this.index = idx + 1;
    });
    // todo: review - this is just used by append action - event consolidation ?
    document.addEventListener('index-changed', e => {
      e.stopPropagation();
      if (!e.target === this) return;
      const { index } = e.detail;
      this.index = Number(index);
    });

    // if (this.getOwnerForm().lazyRefresh) {
    this.mutationObserver = new MutationObserver(mutations => {
      if (mutations[0].type === 'childList') {
        const added = mutations[0].addedNodes[0];
        if (added) {
          const instance = XPathUtil.resolveInstance(this, this.ref);
          const path = getPath(added, instance);
          // this.dispatch('path-mutated',{'path':path,'nodeset':this.nodeset,'index': this.index});
          // this.index = index;
          // const prev = mutations[0].previousSibling.previousElementSibling;
          // const index = prev.index();
          // this.applyIndex(this.index -1);

          Fore.dispatch(this, 'path-mutated', { path, index: this.index });
        }
      }
    });
    // }
    this.getOwnerForm().registerLazyElement(this);

    const style = `
      :host{
      }
       .fade-out-bottom {
          -webkit-animation: fade-out-bottom 0.7s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
          animation: fade-out-bottom 0.7s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
      }
      .fade-out-bottom {
          -webkit-animation: fade-out-bottom 0.7s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
          animation: fade-out-bottom 0.7s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
      }
   `;
    const html = `
          <slot></slot>
    `;
    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
        `;

    // this.init();
  }

  async init() {
    // ### there must be a single 'template' child

    const inited = new Promise(resolve => {
      // console.log('##### repeat-attributes init ', this.id);
      // if(!this.inited) this.init();
      // does not use this.evalInContext as it is expecting a nodeset instead of single node
      this._evalNodeset();
      // console.log('##### ',this.id, this.nodeset);

      this._initTemplate();
      // this._initRepeatItems();

      this.setAttribute('index', this.index);
      this.inited = true;
      resolve('done');
    });

    return inited;
  }

  _getRef() {
    return this.getAttribute('ref');
  }

  /**
   * repeat has no own modelItems
   * @private
   */
  _evalNodeset() {
    // const inscope = this.getInScopeContext();
    const inscope = getInScopeContext(this.getAttributeNode('ref') || this, this.ref);
    // console.log('##### inscope ', inscope);
    // console.log('##### ref ', this.ref);
    // now we got a nodeset and attach MutationObserver to it

    if (this.mutationObserver && inscope.nodeName) {
      this.mutationObserver.observe(inscope, {
        childList: true,
        subtree: true,
      });
    }

    const rawNodeset = evaluateXPath(this.ref, inscope, this);
    if (rawNodeset.length === 1 && Array.isArray(rawNodeset[0])) {
      // This XPath likely returned an XPath array. Just collapse to that array
      this.nodeset = rawNodeset[0];
      return;
    }
    this.nodeset = rawNodeset;
  }

  async refresh(force) {
    if (!this.inited) this.init();
    this._evalNodeset();

    let repeatItems = this.querySelectorAll('.fx-repeatitem');
    let repeatItemCount = repeatItems.length;

    let nodeCount = 1;
    if (Array.isArray(this.nodeset)) {
      nodeCount = this.nodeset.length;
    }

    // const contextSize = this.nodeset.length;
    const contextSize = nodeCount;
    // todo: review - cant the context really never be smaller than the repeat count?
    // todo: this code can be deprecated probably but check first
    if (contextSize < repeatItemCount) {
      for (let position = repeatItemCount; position > contextSize; position -= 1) {
        // remove repeatitem
        const itemToRemove = repeatItems[position - 1];
        itemToRemove.parentNode.removeChild(itemToRemove);
        this._contextItemByRepeatItem.delete(itemToRemove);
        this.getOwnerForm().unRegisterLazyElement(itemToRemove);
        // this._fadeOut(itemToRemove);
        // Fore.fadeOutElement(itemToRemove)
        this.getOwnerForm().someInstanceDataStructureChanged = true;
      }
    }

    if (contextSize > repeatItemCount) {
      for (let position = repeatItemCount + 1; position <= contextSize; position += 1) {
        // add new repeatitem

        const clonedTemplate = this._createNewRepeatItem(position, this.nodeset[position - 1]);
        if (!clonedTemplate) return;

        this.getOwnerForm().someInstanceDataStructureChanged = true;
      }
    }

    // ### update nodeset of repeatitems
    repeatItems = this.querySelectorAll(':scope > .fx-repeatitem');
    repeatItemCount = repeatItems.length;

    for (let position = 0; position < repeatItemCount; position += 1) {
      const item = repeatItems[position];
      this.getOwnerForm().registerLazyElement(item);

      if (item.nodeset !== this.nodeset[position]) {
        item.nodeset = this.nodeset[position];
      }

      this._contextItemByRepeatItem.set(item, this.nodeset[position]);
    }

    // Fore.refreshChildren(clone,true);
    const fore = this.getOwnerForm();
    if (!fore.lazyRefresh || force) {
      Fore.refreshChildren(this, force);
    }
    // this.style.display = 'block';
    // this.style.display = this.display;
    this.setIndex(this.index);
  }

  _dispatchIndexChange() {
    this.dispatchEvent(
      new CustomEvent('item-changed', {
        composed: false,
        bubbles: true,
        detail: { item: this, index: this.index },
      }),
    );
  }

  // eslint-disable-next-line class-methods-use-this
  _fadeOut(el) {
    el.style.opacity = 1;

    (function fade() {
      // eslint-disable-next-line no-cond-assign
      if ((el.style.opacity -= 0.1) < 0) {
        el.style.display = 'none';
      } else {
        requestAnimationFrame(fade);
      }
    })();
  }

  // eslint-disable-next-line class-methods-use-this
  _fadeIn(el) {
    if (!el) return;

    el.style.opacity = 0;
    el.style.display = this.display;

    (function fade() {
      // setTimeout(() => {
      let val = parseFloat(el.style.opacity);
      // eslint-disable-next-line no-cond-assign
      if (!((val += 0.1) > 1)) {
        el.style.opacity = val;
        requestAnimationFrame(fade);
      }
      // }, 40);
    })();
  }

  async _initTemplate() {
    // const defaultSlot = this.shadowRoot.querySelector('slot');
    // todo: this is still weak - should handle that better maybe by an explicit slot?
    // this.template = this.firstElementChild;
    this.template = this.querySelector('template');

    /*
    if (this.template === null) {
      // console.error('### no template found for this repeat:', this.id);
      // todo: catch this on form element
      this.dispatchEvent(
        new CustomEvent('no-template-error', {
          composed: true,
          bubbles: true,
          detail: { message: `no template found for repeat:${this.id}` },
        }),
      );
    }
*/
    if (!this.template) {
      return;
    }

    this.shadowRoot.appendChild(this.template);
  }

  _initVariables(newRepeatItem) {
    const inScopeVariables = new Map(this.inScopeVariables);
    newRepeatItem.setInScopeVariables(inScopeVariables);
    (function registerVariables(node) {
      for (const child of node.children) {
        if ('setInScopeVariables' in child) {
          child.setInScopeVariables(inScopeVariables);
        }
        registerVariables(child);
      }
    })(newRepeatItem);
  }

  /**
   * @override
   *
   * @param {number} insertionIndex - the one-based index of where to insert the new node
   * @param {Node} node - The node related to this new repeat item
   *
   * @returns {HTMLElement}
   */
  _createNewRepeatItem(insertionIndex, node) {
    this.template = this.shadowRoot.querySelector('template');
    if (!this.template) return null;
    const newNode = /** @type {HTMLElement} */ (
      this.template.content.firstElementChild.cloneNode(true)
    );

    // ### cloned templates are always appended to the binding element - the one having the data-ref
    const bindingElement = this.querySelector('[data-ref]');

    const repeatItems = bindingElement.querySelectorAll('.fx-repeatitem');

    const beforeNode = repeatItems[insertionIndex - 1] ?? null; // Null appends by default
    bindingElement.insertBefore(newNode, beforeNode);
    newNode.classList.add('fx-repeatitem');
    // newNode.setAttribute('index', `${insertionIndex}`);

    newNode.addEventListener('click', this._dispatchIndexChange);
    // this.addEventListener('focusin', this._handleFocus);
    newNode.addEventListener('focusin', this._dispatchIndexChange);

    this._contextItemByRepeatItem.set(newNode, node);

    return newNode;
  }

  _removeIndexMarker() {
    const refd = this.querySelector('[data-ref]');
    Array.from(refd.children).forEach(item => {
      item.removeAttribute('repeat-index');
    });
  }

  setInScopeVariables(inScopeVariables) {
    // Repeats are interesting: the variables should be scoped per repeat item, they should not be
    // able to see the variables in adjacent repeat items!
    this.inScopeVariables = new Map(inScopeVariables);
  }
}

if (!customElements.get('fx-repeat-attributes')) {
  window.customElements.define('fx-repeat-attributes', FxRepeatAttributes);
}
