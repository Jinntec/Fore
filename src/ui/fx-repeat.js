import './fx-repeatitem.js';

import { Fore } from '../fore.js';
import ForeElementMixin from '../ForeElementMixin.js';
import { evaluateXPath } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
import { XPathUtil } from '../xpath-util.js';
import { withDraggability } from '../withDraggability.js';

// import {DependencyNotifyingDomFacade} from '../DependencyNotifyingDomFacade';

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
export class FxRepeat extends withDraggability(ForeElementMixin, false) {
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
    this.isDraggable = null;
    this.dropTarget = null;
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
    return parseInt(this.getAttribute('index'), 10);
  }

  set index(idx) {
    this.setAttribute('index', idx);
  }

  _getRef() {
    return this.getAttribute('ref');
  }

  connectedCallback() {
    super.connectedCallback();
    // console.log('connectedCallback',this);
    // this.display = window.getComputedStyle(this, null).getPropertyValue("display");
    this.ref = this.getAttribute('ref');
    // this.ref = this._getRef();
    // console.log('### fx-repeat connected ', this.id);
    this.addEventListener('item-changed', e => {
      const { item } = e.detail;
      const idx = Array.from(this.children).indexOf(item);
      this.applyIndex(this.children[idx]);
      this.index = idx + 1;
    });
    // todo: review - this is just used by append action - event consolidation ?
    document.addEventListener('index-changed', e => {
      e.stopPropagation();
      if (!e.target === this) return;
      // const { item } = e.detail;
      // const idx = Array.from(this.children).indexOf(item);
      const { index } = e.detail;
      this.index = parseInt(index, 10);
      this.applyIndex(this.children[index - 1]);
    });
    /*
        document.addEventListener('insert', e => {
          const nodes = e.detail.insertedNodes;
          this.index = e.detail.position;
          console.log('insert catched', nodes, this.index);
        });
    */

    // if (this.getOwnerForm().lazyRefresh) {
    this.mutationObserver = new MutationObserver(mutations => {
      // console.log('mutations', mutations);

      if (mutations[0].type === 'childList') {
        const added = mutations[0].addedNodes[0];
        if (added) {
          const instance = XPathUtil.resolveInstance(this, this.ref);
          const path = XPathUtil.getPath(added, instance);
          // console.log('path mutated', path);
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
          <slot name="header"></slot>
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

  _createNewRepeatItem() {
    const newItem = document.createElement('fx-repeatitem');

    if (this.isDraggable) {
      newItem.setAttribute('draggable', 'true');
      newItem.setAttribute('tabindex', 0);
    }
    const clone = this._clone();
    newItem.appendChild(clone);

    return newItem;
  }

  init() {
    // ### there must be a single 'template' child
    console.log('##### repeat init ', this.id);
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

    /*
              this.touchedPaths = new Set();
              const instance = XPathUtil.resolveInstance(this, this.ref);
              const depTrackDomfacade = new DependencyNotifyingDomFacade((node) => {
                  this.touchedPaths.add(XPathUtil.getPath(node, instance));
              });
              const rawNodeset = evaluateXPath(this.ref, inscope, this, {}, {}, depTrackDomfacade );
        */
    const rawNodeset = evaluateXPath(this.ref, inscope, this);

    // console.log('Touched!', this.ref, [...this.touchedPaths].join(', '));
    if (rawNodeset.length === 1 && Array.isArray(rawNodeset[0])) {
      // This XPath likely returned an XPath array. Just collapse to that array
      this.nodeset = rawNodeset[0];
      return;
    }
    this.nodeset = rawNodeset;
  }

  async refresh(force) {
    // console.group('fx-repeat.refresh on', this.id);

    if (!this.inited) this.init();
    // console.time('repeat-refresh', this);
    this._evalNodeset();

    // ### register ourselves as boundControl
    /*
            const modelItem = this.getModelItem();
            if (!modelItem.boundControls.includes(this)) {
              modelItem.boundControls.push(this);
            }
        */
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

        const newItem = this._createNewRepeatItem();

        this.appendChild(newItem);
        this._initVariables(newItem);

        newItem.nodeset = this.nodeset[position - 1];
        newItem.index = position;
        // Tell the owner form we might have new template expressions here
        this.getOwnerForm().scanForNewTemplateExpressionsNextRefresh();
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
    // this.style.display = this.display;
    this.setIndex(this.index);
    // console.timeEnd('repeat-refresh');

    // this.replaceWith(clone);

    // this.repeatCount = contextSize;
    // console.log('repeatCount', this.repeatCount);
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
    this.template = this.querySelector('template');
    // console.log('### init template for repeat ', this.id, this.template);
    // todo: this.dropTarget not needed?
    this.dropTarget = this.template.getAttribute('drop-target');
    this.isDraggable = this.template.hasAttribute('draggable')
      ? this.template.getAttribute('draggable')
      : null;

    if (this.template === null) {
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
    this.nodeset.forEach((item, index) => {
      const repeatItem = this._createNewRepeatItem();
      repeatItem.nodeset = this.nodeset[index];
      repeatItem.index = index + 1; // 1-based index

      this.appendChild(repeatItem);

      if (repeatItem.index === 1) {
        this.applyIndex(repeatItem);
      }
      // console.log('*********repeat item created', repeatItem.nodeset)
      Fore.dispatch(this, 'item-created', { nodeset: repeatItem.nodeset, pos: index + 1 });
      this._initVariables(repeatItem);
    });
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

  setInScopeVariables(inScopeVariables) {
    // Repeats are interesting: the variables should be scoped per repeat item, they should not be
    // able to see the variables in adjacent repeat items!
    this.inScopeVariables = new Map(inScopeVariables);
  }
}

if (!customElements.get('fx-repeat')) {
  window.customElements.define('fx-repeat', FxRepeat);
}
