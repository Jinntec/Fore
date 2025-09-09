import './fx-repeatitem.js';

import { Fore } from '../fore.js';
import ForeElementMixin from '../ForeElementMixin.js';
import { evaluateXPath } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
import { XPathUtil } from '../xpath-util.js';
import { withDraggability } from '../withDraggability.js';
import { UIElement } from './UIElement.js';
import { getPath } from '../xpath-path.js';
import { FxModel } from '../fx-model';

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
 * @extends {ForeElementMixin}
 */
export class FxRepeat extends withDraggability(UIElement, false) {
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

    this.getOwnerForm().refresh({ reason: 'index-function', elementLocalnamesWithChanges: [] });
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
    this.dependencies.addXPath(this.ref);
    // this.ref = this._getRef();
    // console.log('### fx-repeat connected ', this.id);
    this.addEventListener('item-changed', e => {
      const { item } = e.detail;
      this.setIndex(item.index);
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

    // Listen for insertion events
    this.getOwnerForm().addEventListener('insert', event => {
      const { detail } = event;
      if (!detail || detail.ref !== this.ref) return;

      // grab the current repeat items (tweak selector if yours differs)
      const items = Array.from(
        this.querySelectorAll(
          ':scope > fx-repeat-item, :scope > fx-repeatitem, :scope > .repeat-item',
        ),
      );

      // search fx-bind elements with same nodeset as this repeat - if present update modelItem instead of creating one
      const newRepeatItem = this._createNewRepeatItem();
      // insert so the new item becomes position `pos`
      const beforeNode = items[detail.index - 1] || null; // null appends
      this.insertBefore(newRepeatItem, beforeNode);
      newRepeatItem.nodeset = detail.insertedNodes[0];
      this.setAttribute('index', detail.index);
      this.applyIndex(newRepeatItem);

      this.getOwnerForm().addToBatchedNotifications(newRepeatItem);
    });

    /*
    this.getOwnerForm().addEventListener('insert', e => {
      const { detail } = event;
      this.index = detail.index;
      console.log('insert catched', this.index);
      if (!detail || detail.targetRef !== this.ref) return;

      // Schedule a targeted refresh for the affected repeat items
      const affectedNodes = detail.insertedNodes || [];
      for (const node of affectedNodes) {
        this.scheduleRefreshForNode(node);
      }
    });
*/

    // this.insertLocation = e.detail.location;
    // console.log('insert catched', this.insertLocation);
    // this.position = e.detail.position;
    // console.log('insert catched', this.position);

    // });

    // if (this.getOwnerForm().lazyRefresh) {
    /**
     * @type {MutationRecord[]}
     */
    let bufferedMutationRecords = [];
    let debouncedOnMutations = null;
    this.mutationObserver = new MutationObserver(mutations => {
      bufferedMutationRecords.push(...mutations);
      if (!debouncedOnMutations) {
        debouncedOnMutations = new Promise(() => {
          debouncedOnMutations = null;
          const records = bufferedMutationRecords;
          bufferedMutationRecords = [];
          let shouldRefresh = false;
          for (const mutation of records) {
            if (mutation.type === 'childList') {
              const added = mutation.addedNodes[0];
              if (added) {
                const instance = XPathUtil.resolveInstance(this, this.ref);
                const path = getPath(added, instance);
                // this.handleInsert(added);
                // console.log('path mutated', path);
                // this.dispatch('path-mutated',{'path':path,'nodeset':this.nodeset,'index': this.index});
                // this.index = index;
                // const prev = mutations[0].previousSibling.previousElementSibling;
                // const index = prev.index();
                // this.applyIndex(this.index -1);

                Fore.dispatch(this, 'path-mutated', { path, index: this.index });
              }
              const deleted = mutation.removedNodes[0];
              if (deleted) {
                this.handleDelete(deleted);
              }
              /*
              if (!this.getOwnerForm().initialRun) {
                shouldRefresh = true;
              }
*/
            }
          }

          /*
          if (shouldRefresh) {
            this.refresh();
          }
*/
        });
      }
    });

    // console.log('mutations', mutations);
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
          <slot name="footer"></slot>
        `;
    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
        `;

    // this.init();
  }

  async handleInsert(added) {
    console.log('handleInsert', added);
    this._evalNodeset();

    // grab the current repeat items (tweak selector if yours differs)
    const items = Array.from(
      this.querySelectorAll(
        ':scope > fx-repeat-item, :scope > fx-repeatitem, :scope > .repeat-item',
      ),
    );

    // search fx-bind elements with same nodeset as this repeat - if present update modelItem instead of creating one
    const newRepeatItem = this._createNewRepeatItem();
    // insert so the new item becomes position `pos`
    const beforeNode = items[this.index - 1] || null; // null appends
    this.insertBefore(newRepeatItem, beforeNode);
    newRepeatItem.nodeset = added;
    this.setAttribute('index', this.index);
    this.applyIndex(newRepeatItem);

    const newModelItem = FxModel.lazyCreateModelItem(
      this.getModel(),
      this.ref,
      added,
      newRepeatItem,
    );

    newModelItem.path += '_1';
    console.log('newModelItem', newModelItem);

    newRepeatItem.modelItem = newModelItem;
    this.getModel().registerModelItem(newModelItem);

    this.getOwnerForm().addToBatchedNotifications(newModelItem);
    this.getOwnerForm().scanForNewTemplateExpressionsNextRefresh();
    this.getOwnerForm().addToBatchedNotifications(newRepeatItem);
  }

  handleDelete(deleted) {
    console.log('handleDelete', deleted);
  }

  /**
   * @returns {import('./fx-repeatitem.js').FxRepeatitem}
   */
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
    console.log('🔄 fx-repeat.refresh on', this.id);

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

        if (this.getOwnerForm().createNodes) {
          this.getOwnerForm().initData(newItem);
        }

        // Tell the owner form we might have new template expressions here
        this.getOwnerForm().scanForNewTemplateExpressionsNextRefresh();

        newItem.refresh(true);
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

    // Fore.refreshChildren(clone, true);
    const fore = this.getOwnerForm();
    // if (!fore.lazyRefresh || force) {
    if (!fore.lazyRefresh || force) {
      // Turn the possibly conditional force refresh into a forced one: we changed our children
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

      if (this.getOwnerForm().createNodes) {
        this.getOwnerForm().initData(repeatItem);
        const repeatItemClone = repeatItem.nodeset.cloneNode(true);
        this.clearTextValues(repeatItemClone);

        // this.createdNodeset = repeatItem.nodeset.cloneNode(true);
        this.createdNodeset = repeatItemClone;
        // console.log('createdNodeset', this.createdNodeset)
      }

      if (repeatItem.index === 1) {
        this.applyIndex(repeatItem);
      }
      // console.log('*********repeat item created', repeatItem.nodeset);
      Fore.dispatch(this, 'item-created', { nodeset: repeatItem.nodeset, pos: index + 1 });
      this._initVariables(repeatItem);
    });
  }
  clearTextValues(node) {
    if (!node) return;

    // Clear text node content
    if (node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = '';
    }

    // Clear all attribute values
    if (node.nodeType === Node.ELEMENT_NODE) {
      for (const attr of Array.from(node.attributes)) {
        attr.value = ''; // Clear attribute value
      }
    }

    // Recursively clear child nodes
    for (const child of node.childNodes) {
      this.clearTextValues(child);
    }
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
