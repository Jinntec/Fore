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

/**
 * `fx-repeat`
 *
 * Repeats its template for each node in its' bound nodeset.
 *
 * Template is a standard HTML `<template>` element. Once instanciated the template
 * is moved to the shadowDOM of the repeat for safe re-use.
 *
 * @customElement
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

    this.handleInsertHandler = null;
    this.handleDeleteHandler = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.template = this.querySelector('template');

    this.ref = this.getAttribute('ref');
    this.dependencies.addXPath(this.ref);

    this.addEventListener('item-changed', e => {
      const { item } = e.detail;
      this.setIndex(item.index);
    });

    // ----------------
    // INSERT handler
    // ----------------
    this.handleInsertHandler = event => {
      const { detail } = event;
      const myForeId = this.getOwnerForm().id;
      if (myForeId !== detail.foreId) return;

      // Re-evaluate nodeset (insert can come from many sources)
      const oldNodesetLength = this.nodeset.length;
      this._evalNodeset();
      const newNodesetLength = this.nodeset.length;
      if (oldNodesetLength === newNodesetLength) return;

      const insertedNode = detail.insertedNodes;
      const insertionIndex = this.nodeset.indexOf(insertedNode) + 1; // 1-based

      const repeatItems = Array.from(
          this.querySelectorAll(
              ':scope > fx-repeat-item, :scope > fx-repeatitem, :scope > .repeat-item',
          ),
      );

      const newRepeatItem = this._createNewRepeatItem();

      const beforeNode = repeatItems[insertionIndex - 1] ?? null;
      this.insertBefore(newRepeatItem, beforeNode);
      newRepeatItem.index = insertionIndex;
      this._initVariables(newRepeatItem);

      newRepeatItem.nodeset = insertedNode;

      for (let i = insertionIndex - 1; i < repeatItems.length; ++i) {
        repeatItems[i].index += 1;
      }

      this.setIndex(insertionIndex);

      this.opNum++;
      const parentModelItem = FxBind.createModelItem(
          this.ref,
          insertedNode,
          newRepeatItem,
          this.opNum,
      );
      newRepeatItem.modelItem = parentModelItem;
      this.getModel().registerModelItem(parentModelItem);

      this._createModelItemsRecursively(newRepeatItem, parentModelItem);

      this.getOwnerForm().scanForNewTemplateExpressionsNextRefresh();
      this.getOwnerForm().addToBatchedNotifications(newRepeatItem);
    };

    // ----------------
    // DELETE handler
    // ----------------
    this.handleDeleteHandler = event => {
      const { detail } = event;
      if (!detail || !detail.deletedNodes || detail.deletedNodes.length === 0) return;

      const myForeId = this.getOwnerForm().id;
      if (detail.foreId && myForeId !== detail.foreId) return;

      const first = detail.deletedNodes[0];
      const isJson = !!detail.isJson || !!first?.__jsonlens__;

      if (isJson) {
        // IMPORTANT:
        // No forced refresh. We delete exactly the affected repeat item and
        // re-bind the remaining repeat items to the *updated* JSONNode children
        // of the same array-parent (no XPath re-evaluation).
        this._handleJsonDeleted(detail);
        return;
      }

      // XML delete: keep existing behavior
      detail.deletedNodes.forEach(node => {
        this.handleDelete(node);
      });
      this.getOwnerForm().addToBatchedNotifications(this);
    };

    document.addEventListener('insert', this.handleInsertHandler, true);
    document.addEventListener('deleted', this.handleDeleteHandler, true);

    // ----------------
    // Mutation observer (XML only)
    // ----------------
    let bufferedMutationRecords = [];
    let debouncedOnMutations = null;
    this.mutationObserver = new MutationObserver(mutations => {
      bufferedMutationRecords.push(...mutations);
      if (!debouncedOnMutations) {
        debouncedOnMutations = new Promise(() => {
          debouncedOnMutations = null;
          const records = bufferedMutationRecords;
          bufferedMutationRecords = [];
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
      :host{ }
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

  _createModelItemsRecursively(parentNode, parentModelItem) {
    const parentWithDewey = parentModelItem?.path || null;

    const __applyDeweyRewrite = mi => {
      if (!mi || typeof mi.path !== 'string' || !parentModelItem?.path) return;

      const pWith = parentModelItem.path;
      const opMatch = pWith.match(/_(\d+)$/);
      if (!opMatch) return;
      const op = opMatch[1];

      const toDollar = s => s.replace(/^instance\('([^']+)'\)\//, (_m, g1) => `$${g1}/`);
      const parentBaseNorm = toDollar(pWith).replace(/_\d+$/, '');
      const childNorm = toDollar(mi.path);

      if (!childNorm.startsWith(parentBaseNorm)) return;

      const childUsesInstanceFn = /^instance\('/.test(mi.path);
      const parentBaseInChildStyle = childUsesInstanceFn
          ? parentBaseNorm.replace(/^\$([A-Za-z0-9_-]+)\//, `instance('$1')/`)
          : parentBaseNorm;

      if (mi.path.startsWith(`${parentBaseInChildStyle}_`)) return;

      mi.path = `${parentBaseInChildStyle}_${op}${mi.path.slice(parentBaseInChildStyle.length)}`;
    };

    Array.from(parentNode.children).forEach(child => {
      const nextParentMI = parentModelItem;

      const isWidgetEl =
          child &&
          ((child.classList && child.classList.contains('widget')) ||
              (typeof Fore !== 'undefined' && Fore.isWidget && Fore.isWidget(child)) ||
              (child.tagName &&
                  ['INPUT', 'SELECT', 'TEXTAREA', 'OPTION', 'DATALIST'].includes(child.tagName)));

      if (!isWidgetEl && child.hasAttribute('ref')) {
        const ref = child.getAttribute('ref').trim();
        if (ref && ref !== '.') {
          let node = evaluateXPath(ref, parentModelItem.node, this);
          if (Array.isArray(node)) node = node[0];

          if (node) {
            let modelItem = this.getModel().getModelItem(node);
            if (!modelItem) {
              modelItem = FxBind.createModelItem(ref, node, child, null);
              modelItem.parentModelItem = parentModelItem;
              this.getModel().registerModelItem(modelItem);
            }

            __applyDeweyRewrite(modelItem);

            child.nodeset = node;
            if (child.attachObserver) child.attachObserver();
          }
        }
      }

      if (!isWidgetEl) this._createModelItemsRecursively(child, nextParentMI);
    });
  }

  /**
   * JSON delete without forced refresh:
   * - remove the exact repeat item(s)
   * - rebind remaining repeatitems to the updated JSONNode children of the same parent array
   * - refresh only affected repeatitems (from deleted index onward)
   */
  _handleJsonDeleted(detail) {
    const fore = this.getOwnerForm();

    const repeatItems = () =>
        Array.from(
            this.querySelectorAll(
                ':scope > fx-repeat-item, :scope > fx-repeatitem, :scope > .repeat-item',
            ),
        );

    const deletedNodes = Array.from(detail.deletedNodes || []);

    // Collect indices to remove (0-based), prefer keyOrIndex when deletion came from an array.
    const indices = deletedNodes
        .map(n => {
          if (!n) return -1;
          if (typeof n.keyOrIndex === 'number') return n.keyOrIndex;
          // fallback: identity
          const idx = this.nodeset.findIndex(x => x === n);
          return idx;
        })
        .filter(i => i >= 0)
        .sort((a, b) => b - a); // delete from end

    if (indices.length === 0) return;

    // We rebind against the updated array parent if possible.
    // For a repeat over ?items, each item is a child of the same array-container node.
    const arrayParent = deletedNodes.find(n => n?.parent && Array.isArray(n.parent.value))?.parent;

    // Remove repeat items in descending order
    const itemsBefore = repeatItems();
    for (const idx0 of indices) {
      const itemEl = itemsBefore[idx0];
      if (itemEl) {
        // Clean lazy registration
        try {
          fore.unRegisterLazyElement(itemEl);
        } catch (_e) {
          // ignore
        }
        itemEl.remove();
      }

      // Keep our local nodeset in sync
      if (Array.isArray(this.nodeset)) {
        this.nodeset.splice(idx0, 1);
      }

      // Adjust selection immediately (keeps UX stable)
      const removed1 = idx0 + 1;
      if (this.index > removed1) {
        this.setIndex(this.index - 1);
      } else if (this.index === removed1) {
        // select the item now at this position, or the last if we removed the last
        const newSize = Math.max(0, this.nodeset.length);
        const next = newSize === 0 ? 0 : Math.min(removed1, newSize);
        this.setIndex(next);
      }
    }

    // If we can, rebind nodeset to the authoritative updated children of the array parent.
    // This avoids XPath re-evaluation.
    if (arrayParent && Array.isArray(arrayParent.children)) {
      this.nodeset = arrayParent.children;
    }

    // Reindex + rebind remaining repeatitems from the first affected index onward.
    const minIdx0 = Math.min(...indices);
    const after = repeatItems();

    for (let i = minIdx0; i < after.length; i++) {
      const ri = after[i];
      // 1-based index attribute
      ri.index = i + 1;

      // Rebind to the new nodeset position.
      const newNode = this.nodeset[i];
      if (ri.nodeset !== newNode) {
        ri.nodeset = newNode;
        if (fore.createNodes) fore.initData(ri);
      }

      // Refresh only the changed repeat item subtree
      fore.addToBatchedNotifications(ri);
    }
  }

  handleDelete(deleted) {
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

    const newLength = this.querySelectorAll(
        ':scope > fx-repeat-item, :scope > fx-repeatitem, :scope > .repeat-item',
    ).length;

    let nextIndex = indexToRemove + 1;
    if (newLength === 0) {
      nextIndex = 0;
    } else if (nextIndex > newLength) {
      nextIndex = newLength;
    }

    this.setIndex(nextIndex);
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
    this._evalNodeset();
    this._initTemplate();
    this._initRepeatItems();

    this.setAttribute('index', this.index);
    this.inited = true;
  }

  _evalNodeset() {
    const inscope = getInScopeContext(this.getAttributeNode('ref') || this, this.ref);
    if (!inscope) return;

    // Mutation observer only for XML DOM nodes
    if (this.mutationObserver && inscope.nodeName) {
      this.mutationObserver.observe(inscope, {
        childList: true,
        subtree: true,
      });
    }

    const rawNodeset = evaluateXPath(this.ref, inscope, this);

    if (rawNodeset.length === 1 && Array.isArray(rawNodeset[0])) {
      this.nodeset = rawNodeset[0];
      return;
    }
    this.nodeset = rawNodeset;
  }

  async refresh(force) {
    if (!this.inited) this.init();

    this._evalNodeset();

    const repeatItems = this.querySelectorAll(':scope > fx-repeatitem');
    const repeatItemCount = repeatItems.length;

    let nodeCount = 1;
    if (Array.isArray(this.nodeset)) {
      nodeCount = this.nodeset.length;
    }

    const contextSize = nodeCount;

    if (contextSize < repeatItemCount) {
      for (let position = repeatItemCount; position > contextSize; position -= 1) {
        const itemToRemove = repeatItems[position - 1];
        itemToRemove.parentNode.removeChild(itemToRemove);
        this.getOwnerForm().unRegisterLazyElement(itemToRemove);
      }
    }

    if (contextSize > repeatItemCount) {
      for (let position = repeatItemCount + 1; position <= contextSize; position += 1) {
        const newItem = this._createNewRepeatItem();
        this.appendChild(newItem);

        this._initVariables(newItem);

        newItem.nodeset = this.nodeset[position - 1];
        newItem.index = position;

        if (this.getOwnerForm().createNodes) {
          this.getOwnerForm().initData(newItem);
        }

        this.getOwnerForm().scanForNewTemplateExpressionsNextRefresh();

        newItem.refresh(true);
      }
    }

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

    const fore = this.getOwnerForm();
    if (!fore.lazyRefresh || force) {
      Fore.refreshChildren(this, force);
    }

    this.setIndex(this.index);
  }

  _initTemplate() {
    this.dropTarget = this.template.getAttribute('drop-target');
    this.isDraggable = this.template.hasAttribute('draggable')
        ? this.template.getAttribute('draggable')
        : null;

    if (this.template === null) {
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
      repeatItem.index = index + 1;

      this.appendChild(repeatItem);

      if (this.getOwnerForm().createNodes) {
        this.getOwnerForm().initData(repeatItem);
        if (repeatItem.nodeset.nodeType) {
          const repeatItemClone = repeatItem.nodeset.cloneNode(true);
          this.clearTextValues(repeatItemClone);
          this.createdNodeset = repeatItemClone;
        }
      }

      if (repeatItem.index === 1) {
        this.applyIndex(repeatItem);
      }

      Fore.dispatch(this, 'item-created', { nodeset: repeatItem.nodeset, pos: index + 1 });
      this._initVariables(repeatItem);
    });
  }

  clearTextValues(node) {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      for (const attr of Array.from(node.attributes)) {
        attr.value = '';
      }
    }

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
    this.inScopeVariables = new Map(inScopeVariables);
  }
}

if (!customElements.get('fx-repeat')) {
  window.customElements.define('fx-repeat', FxRepeat);
}
