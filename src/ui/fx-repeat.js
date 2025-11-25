import './fx-repeatitem.js';

import { Fore } from '../fore.js';
import ForeElementMixin from '../ForeElementMixin.js';
import { evaluateXPath } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
import { XPathUtil } from '../xpath-util.js';
import { withDraggability } from '../withDraggability.js';
import { UIElement } from './UIElement.js';
import { getPath } from '../xpath-path.js';
import { FxModel } from '../fx-model.js';
import { FxBind } from '../fx-bind.js';

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
    this.opNum = 0; // global number of operations
  }

  connectedCallback() {
    super.connectedCallback();
    this.template = this.querySelector('template');

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

    // Listen for insertion events
    this.handleInsertHandler = event => {
      const { detail } = event;
      const myForeId = this.getOwnerForm().id;
      if (myForeId !== detail.foreId) {
        return;
      }
      // todo: early out if this.ref does not match the ref of the inserted node. Avoid re-evaluating the nodeset
      // if (this.ref !== detail.ref) return;

      console.log('insert catched', detail);

      // Step 1: Refresh/re-evaluate the nodeset
      const oldNodesetLength = this.nodeset.length;
      this._evalNodeset();
      const newNodesetLength = this.nodeset.length;
      if (oldNodesetLength === newNodesetLength) {
        return;
      }

      /**
       * @type {number}
       */
      //      const insertionIndex = detail.index;
      /**
       * The newly inserted node. TODO: handle multiple?
       * @type {Node}
       */
      const insertedNode = detail.insertedNodes;
      const insertionIndex = this.nodeset.indexOf(insertedNode) + 1;
      // Step 2: Get current repeat items and create a new item
      /**
       * @type {import('./fx-repeatitem.js').FxRepeatitem[]}
       */
      const repeatItems = Array.from(
        this.querySelectorAll(
          ':scope > fx-repeat-item, :scope > fx-repeatitem, :scope > .repeat-item',
        ),
      );

      // todo: search fx-bind elements with same nodeset as this repeat - if present update modelItem instead of creating one
      const newRepeatItem = this._createNewRepeatItem();

      // Step 3: Insert the new repeatItem at the correct position
      const beforeNode = repeatItems[insertionIndex - 1] ?? null; // Null appends by default
      this.insertBefore(newRepeatItem, beforeNode);
      newRepeatItem.index = insertionIndex;
      this._initVariables(newRepeatItem);

      // Step 4: Assign the inserted nodeset to the new `repeatItem`
      newRepeatItem.nodeset = detail.insertedNodes;

      // Update all the indices following here
      for (let i = insertionIndex - 1; i < repeatItems.length; ++i) {
        const sibling = repeatItems[i];
        // TODO: handle the next ones
        sibling.index += 1;
      }

      this.setIndex(insertionIndex); // sets attribute + applies repeat-index + refresh

      // Generate the parent `modelItem` for the new repeat item
      this.opNum++;
      const parentModelItem = FxBind.createModelItem(
        this.ref,
        detail.insertedNodes,
        newRepeatItem,
        this.opNum,
      );
      newRepeatItem.modelItem = parentModelItem;

      this.getModel().registerModelItem(parentModelItem);

      // Step 5: Create modelItems recursively for child elements
      this._createModelItemsRecursively(newRepeatItem, parentModelItem);
      // Step 6: Notify and refresh the UI
      this.getOwnerForm().scanForNewTemplateExpressionsNextRefresh();
      this.getOwnerForm().addToBatchedNotifications(newRepeatItem);
    };
    this.handleDeleteHandler = event => {
      console.log('delete catched', event);
      const { detail } = event;
      if (!detail || !detail.deletedNodes) {
        return;
      }

      // Remove corresponding repeat items for deleted nodes
      detail.deletedNodes.forEach(node => {
        this.handleDelete(node);
        //        this.removeRepeatItemForNode(node);
      });
      this.getOwnerForm().addToBatchedNotifications(this);
    };
    // inside connectedCallback()
    document.addEventListener('insert', this.handleInsertHandler, true);
    document.addEventListener('deleted', this.handleDeleteHandler, true);

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
          const shouldRefresh = false;
          for (const mutation of records) {
            if (mutation.type === 'childList') {
              const added = mutation.addedNodes[0];
              if (added) {
                const instance = XPathUtil.resolveInstance(this, this.ref);
                const path = getPath(added, instance);
                Fore.dispatch(this, 'path-mutated', { path, index: this.index });
              }
            }
          }
        });
      }
    });

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

  disconnectedCallback() {
    document.removeEventListener('deleted', this.handleDeleteHandler, true);
    document.removeEventListener('insert', this.handleInsertHandler, true);
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

    // trying to do without
    // this.getOwnerForm().refresh({ reason: 'index-function', elementLocalnamesWithChanges: [] });
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

  _createModelItemsRecursively(parentNode, parentModelItem) {
    const parentWithDewey = parentModelItem?.path || null; // e.g. $default/AllowanceCharge[2]_1
    const parentBase = parentWithDewey ? parentWithDewey.replace(/_\d+$/, '') : null; // e.g. $default/AllowanceCharge[2]

    // Robust Dewey rewrite that tolerates $inst vs instance('inst') forms
    const __applyDeweyRewrite = mi => {
      if (!mi || typeof mi.path !== 'string' || !parentModelItem?.path) return;

      const pWith = parentModelItem.path; // e.g. $default/AllowanceCharge[2]_1  or  instance('default')/AllowanceCharge[2]_1
      const opMatch = pWith.match(/_(\d+)$/);
      if (!opMatch) return;
      const op = opMatch[1];

      // Normalize to $name/ and strip _n on parent; normalize child for prefix test only
      const toDollar = s => s.replace(/^instance\('([^']+)'\)\//, (_m, g1) => `$${g1}/`);
      const parentBaseNorm = toDollar(pWith).replace(/_\d+$/, ''); // $default/AllowanceCharge[2]
      const childNorm = toDollar(mi.path);

      if (!childNorm.startsWith(parentBaseNorm)) return; // unrelated subtree

      // Preserve original style of child's instance prefix
      const childUsesInstanceFn = /^instance\('/.test(mi.path);
      const parentBaseInChildStyle = childUsesInstanceFn
        ? parentBaseNorm.replace(/^\$([A-Za-z0-9_-]+)\//, `instance('$1')/`)
        : parentBaseNorm;

      // If already suffixed for this parent, nothing to do
      if (mi.path.startsWith(`${parentBaseInChildStyle}_`)) return;

      // Inject _op immediately after the parent base segment
      mi.path = `${parentBaseInChildStyle}_${op}${mi.path.slice(parentBaseInChildStyle.length)}`;
    };

    Array.from(parentNode.children).forEach(child => {
      const nextParentMI = parentModelItem;

      // Skip native/embedded widgets that may carry a 'ref' but are UI only
      const isWidgetEl =
        child &&
        ((child.classList && child.classList.contains('widget')) ||
          (typeof Fore !== 'undefined' && Fore.isWidget && Fore.isWidget(child)) ||
          (child.tagName &&
            ['INPUT', 'SELECT', 'TEXTAREA', 'OPTION', 'DATALIST'].includes(child.tagName)));

      if (!isWidgetEl && child.hasAttribute('ref')) {
        const ref = child.getAttribute('ref').trim();
        if (ref && ref !== '.') {
          // Evaluate the FULL ref once — this yields the terminal (last) node(s)
          let node = evaluateXPath(ref, parentModelItem.node, this);
          if (Array.isArray(node)) node = node[0];

          if (node) {
            let modelItem = this.getModel().getModelItem(node);
            if (!modelItem) {
              // Create a ModelItem only for the final node; children never get their own opNum
              modelItem = FxBind.createModelItem(ref, node, child, null);
              modelItem.parentModelItem = parentModelItem;
              this.getModel().registerModelItem(modelItem);
            }

            // Always apply Dewey rewrite (handles both $inst and instance('inst') forms)
            __applyDeweyRewrite(modelItem);

            child.nodeset = node;
            if (child.attachObserver) child.attachObserver();
          }
        }
      }

      // Recurse into non-widget subtrees
      if (!isWidgetEl) this._createModelItemsRecursively(child, nextParentMI);
    });
  }

  /**
   * Removes the repeat item corresponding to a deleted node.
   * Cleans up its observers and notifies the parent form.
   * @param {Node} node - The deleted node
   */
  removeRepeatItemForNode(node) {
    const index = this.nodeset.indexOf(node);
    if (index === -1) return;

    const repeatItem = this.querySelector(`fx-repeatitem:nth-of-type(${index + 1})`);
    if (repeatItem) {
      this.removeChild(repeatItem);
      this.getOwnerForm().addToBatchedNotifications(this);
    }

    // Remove the node from the nodeset
    this.nodeset.splice(index, 1);
  }

  handleDelete(deleted) {
    console.log('handleDelete', deleted);
    // grab the current repeat items (tweak selector if yours differs)
    /**
     * @type {import('./fx-repeatitem.js').FxRepeatitem[]}
     */
    const items = Array.from(
      this.querySelectorAll(
        ':scope > fx-repeat-item, :scope > fx-repeatitem, :scope > .repeat-item',
      ),
    );

    this._evalNodeset();

    const indexToRemove = items.findIndex(item => item.nodeset === deleted);
    if (indexToRemove === -1) {
      return;
    }
    const itemToRemove = items[indexToRemove];
    itemToRemove.remove();

    // If the list is now empty, clear selection (0). Adjust if you prefer 1-based only.
    const newLength = this.querySelectorAll(
      ':scope > fx-repeat-item, :scope > fx-repeatitem, :scope > .repeat-item',
    ).length;

    let nextIndex = indexToRemove + 1; // 1-based index at the deleted slot
    if (newLength === 0) {
      nextIndex = 0; // nothing left; clear selection
    } else if (nextIndex > newLength) {
      nextIndex = newLength; // deleted the last one; move to new last
    }

    this.setIndex(nextIndex);
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
    if (!inscope) return;
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
        if (this.getOwnerForm().createNodes) {
          this.getOwnerForm().initData(item);
        }
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

  /*
  _clone() {
    // const content = this.template.content.cloneNode(true);
    this.template = this.shadowRoot.querySelector('template');
    const content = this.template.content.cloneNode(true);
    return document.importNode(content, true);
  }
*/

  _clone() {
    // Prefer the cached template set in _initTemplate; fall back to either DOM.
    const tpl =
      this.template ||
      (this.shadowRoot && this.shadowRoot.querySelector('template')) ||
      this.querySelector('template');

    if (!tpl) {
      console.error(`[fx-repeat] ${this.id || ''}: no <template> found when cloning`);
      return document.createDocumentFragment();
    }

    const content = tpl.content.cloneNode(true);
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
