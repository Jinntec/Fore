import './fx-repeatitem.js';

import { Fore } from '../fore.js';
import { foreElementMixin } from '../ForeElementMixin.js';
import { evaluateXPath } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';

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
 */
export class FxRepeat extends foreElementMixin(HTMLElement) {
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
      nodeset: {
        type: Array,
      },
    };
  }

  constructor() {
    super();
    this.ref = '';
    this.dataTemplate = [];
    this.focusOnCreate = '';
    this.initDone = false;
    this.repeatIndex = 1;
    this.nodeset = [];
    this.inited = false;
    this.index = 1;
    this.repeatSize = 0;
    this.attachShadow({ mode: 'open', delegatesFocus: true });
  }

  get repeatSize() {
    return this.querySelectorAll(':scope > fx-repeatitem').length;
  }

  set repeatSize(size) {
    this.size = size;
  }

  setIndex(index) {
    // console.log('new repeat index ', index);
    this.index = index;
    const rItems = this.querySelectorAll(':scope > fx-repeatitem');
    this.applyIndex(rItems[this.index - 1]);
  }

  applyIndex(repeatItem) {
    this._removeIndexMarker();
    if (repeatItem) {
      repeatItem.setAttribute('repeat-index', '');
    }
  }

  get index() {
    return this.getAttribute('index');
  }

  set index(idx) {
    this.setAttribute('index', idx);
  }

  connectedCallback() {
    this.ref = this.getAttribute('ref');
    // console.log('### fx-repeat connected ', this.id);
    this.addEventListener('item-changed', e => {
      console.log('handle index event ', e);
      const { item } = e.detail;
      const idx = Array.from(this.children).indexOf(item);
      this.applyIndex(this.children[idx]);
      this.index = idx + 1;
    });
    // todo: review - this is just used by append action - event consolidation ?
    this.addEventListener('index-changed', e => {
      e.stopPropagation();
      if (!e.target === this) return;
      console.log('handle index event ', e);
      // const { item } = e.detail;
      // const idx = Array.from(this.children).indexOf(item);
      const { index } = e.detail;
      this.index = index;
      this.applyIndex(this.children[index - 1]);
    });
    document.addEventListener('insert', e => {
      const nodes = e.detail.insertedNodes;
      this.index = e.detail.position;
      console.log('insert catched', nodes, this.index);
    });

    if (this.getOwnerForm().lazyRefresh) {
      this.mutationObserver = new MutationObserver(mutations => {
        console.log('mutations', mutations);
        this.refresh(true);
      });
    }
    this.getOwnerForm().registerLazyElement(this);

    const style = `
      :host{
        display:none;
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
          <slot name="header"></slot>
          <slot></slot>
        `;
    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
        `;
  }

  init() {
    // ### there must be a single 'template' child
    // console.log('##### repeat init ', this.id);
    // if(!this.inited) this.init();
    // does not use this.evalInContext as it is expecting a nodeset instead of single node
    this._evalNodeset();
    // console.log('##### ',this.id, this.nodeset);

    this._initTemplate();
    this._initRepeatItems();

    this.setAttribute('index', this.index);
    this.inited = true;
  }

  /**
   * repeat has no own modelItems
   * @private
   */
  _evalNodeset() {
    // const inscope = this.getInScopeContext();
    const inscope = getInScopeContext(this, this.ref);
    // console.log('##### inscope ', inscope);
    // console.log('##### ref ', this.ref);
    // now we got a nodeset and attach MutationObserver to it

    if (this.mutationObserver && inscope.nodeName) {
      this.mutationObserver.observe(inscope, {
        childList: true,
        subtree: true,
      });
    }

    const seq = evaluateXPath(this.ref, inscope, this.getOwnerForm());
    // const seq = evaluateXPathToNodes(this.ref, inscope, this.getOwnerForm());
    if (seq === null) {
      // Empty sequence
      this.nodeset = [];
      return;
    }

    if (typeof seq === 'object') {
      // Either a node or an array
      if ('nodeType' in seq) {
        // Node
        this.nodeset = [seq];
        return;
      }

      // if (Array.isArray(seq) && seq.every(item => typeof item === 'object')) {
      if (Array.isArray(seq)) {
        // multiple Nodes or maps
        this.nodeset = seq;
        return;
      }
    }

    throw new Error(`Unexpected result of repeat nodeset: ${seq}`);
  }

  async refresh(force) {
    // console.group('fx-repeat.refresh on', this.id);

    if (!this.inited) this.init();
    console.time('repeat-refresh', this);
    this._evalNodeset();
    // console.log('repeat refresh nodeset ', this.nodeset);
    // console.log('repeatCount', this.repeatCount);

    const repeatItems = this.querySelectorAll(':scope > fx-repeatitem');
    const repeatItemCount = repeatItems.length;

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
        this.getOwnerForm().unRegisterLazyElement(itemToRemove);
        // this._fadeOut(itemToRemove);
        // Fore.fadeOutElement(itemToRemove)
      }
    }

    if (contextSize > repeatItemCount) {
      for (let position = repeatItemCount + 1; position <= contextSize; position += 1) {
        // add new repeatitem

        const newItem = document.createElement('fx-repeatitem');
        const clonedTemplate = this._clone();
        newItem.appendChild(clonedTemplate);
        this.appendChild(newItem);

        newItem.nodeset = this.nodeset[position - 1];
        newItem.index = position;
      }
    }

    // ### update nodeset of repeatitems
    for (let position = 0; position < repeatItemCount; position += 1) {
      const item = repeatItems[position];
      this.getOwnerForm().registerLazyElement(item);

      if (item.nodeset !== this.nodeset[position]) {
        item.nodeset = this.nodeset[position];
      }
    }

    // Fore.refreshChildren(clone,true);
    const fore = this.getOwnerForm();
    if (!fore.lazyRefresh || force) {
      Fore.refreshChildren(this, force);
    }
    // this.style.display = 'block';
    this.setIndex(this.index);
    console.timeEnd('repeat-refresh');

    // this.replaceWith(clone);

    // this.repeatCount = contextSize;
    // console.log('repeatCount', this.repeatCount);
    console.groupEnd();
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

  _initTemplate() {
    // const shadowTemplate = this.shadowRoot.querySelector('template');
    // console.log('shadowtempl ', shadowTemplate);

    // const defaultSlot = this.shadowRoot.querySelector('slot');
    // todo: this is still weak - should handle that better maybe by an explicit slot?
    // this.template = this.firstElementChild;
    this.template = this.querySelector('template');
    // console.log('### init template for repeat ', this.id, this.template);

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

    this.shadowRoot.appendChild(this.template);
  }

  _initRepeatItems() {
    // const model = this.getModel();
    // this.textContent = '';
    this.nodeset.forEach((item, index) => {
      const repeatItem = document.createElement('fx-repeatitem');
      repeatItem.nodeset = this.nodeset[index];
      repeatItem.index = index + 1; // 1-based index

      const clone = this._clone();
      repeatItem.appendChild(clone);
      this.appendChild(repeatItem);

      if (repeatItem.index === 1) {
        this.applyIndex(repeatItem);
      }
    });
  }

  _clone() {
    // const content = this.template.content.cloneNode(true);
    this.template = this.shadowRoot.querySelector('template');
    const content = this.template.content.cloneNode(true);
    return document.importNode(content, true);
  }

  _removeIndexMarker() {
    Array.from(this.children).forEach(item => {
      item.removeAttribute('repeat-index');
    });
  }
}

window.customElements.define('fx-repeat', FxRepeat);
