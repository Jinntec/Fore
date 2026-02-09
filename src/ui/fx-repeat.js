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

    // Flag used to suppress "programmatic index changed" notifications when setIndex()
    // is called as a direct reaction to a repeatitem's item-changed event.
    this._settingIndexFromItemChanged = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.template = this.querySelector('template');

    this.ref = this.getAttribute('ref');
    this.dependencies.addXPath(this.ref);

    this.addEventListener('item-changed', e => {
      // IMPORTANT: when *we* emit item-changed from the repeat (programmatic setIndex),
      // we must not react to it (would recurse).
      if (e && e.target === this) return;
      if (e?.detail?.source === 'repeat') return;

      const { item } = e.detail;
      this._settingIndexFromItemChanged = true;
      try {
        this.setIndex(item.index);
      } finally {
        this._settingIndexFromItemChanged = false;
      }
    });

    // ----------------
    // INSERT handler
    // ----------------
    this.handleInsertHandler = event => {
      const { detail } = event;
      const myForeId = this.getOwnerForm().id;
      if (myForeId !== detail.foreId) return;

      const fore = this.getOwnerForm();

      // Detect JSON insert (robust)
      const insertedParent = detail?.insertedParent;
      const insertedNode = detail?.insertedNodes;
      const isJson =
        !!detail?.isJson ||
        !!insertedParent?.__jsonlens__ ||
        !!insertedNode?.__jsonlens__ ||
        !!insertedNode?.parent?.__jsonlens__;

      if (isJson) {
        // FILTER: only the repeat whose container ref matches the event ref should handle it.
        // Example:
        //   repeat ref="instance('data')?movies?*"
        //   insert event ref="instance('data')?movies"
        const myRef = String(this.ref || '').trim();
        const myContainerRef = myRef.endsWith('?*') ? myRef.slice(0, -2) : myRef;
        const eventRef = String(detail?.ref || '').trim();

        if (eventRef && eventRef !== myContainerRef) return;

        this._handleJsonInserted(detail);
        return;
      }

      // ----------------
      // XML insert: keep existing behavior
      // ----------------
      const oldNodesetLength = this.nodeset.length;
      this._evalNodeset();
      const newNodesetLength = this.nodeset.length;
      if (oldNodesetLength === newNodesetLength) return;

      const inserted = detail.insertedNodes;
      const insertionIndex = this.nodeset.indexOf(inserted) + 1; // 1-based

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

      newRepeatItem.nodeset = inserted;

      for (let i = insertionIndex - 1; i < repeatItems.length; ++i) {
        repeatItems[i].index += 1;
      }

      this.setIndex(insertionIndex);

      this.opNum++;
      let parentModelItem = FxBind.createModelItem(this.ref, inserted, newRepeatItem, this.opNum);
      // IMPORTANT: registerModelItem may return an existing canonical ModelItem for the same path.
      // Always keep using the returned instance to avoid "ghost" ModelItems that still notify.
      parentModelItem = this.getModel().registerModelItem(parentModelItem);
      newRepeatItem.modelItem = parentModelItem;

      this._createModelItemsRecursively(newRepeatItem, parentModelItem);

      fore.scanForNewTemplateExpressionsNextRefresh();
      fore.addToBatchedNotifications(newRepeatItem);
    };

    // ----------------
    // DELETE handler
    // ----------------
    this.handleDeleteHandler = event => {
      const { detail } = event;
      if (!detail || !detail.deletedNodes || detail.deletedNodes.length === 0) return;

      const fore = this.getOwnerForm();
      const myForeId = fore?.id;
      if (detail.foreId && myForeId !== detail.foreId) return;

      const deletedNodes = Array.from(detail.deletedNodes || []);
      const first = deletedNodes[0];

      const isJson =
          !!detail.isJson ||
          !!first?.__jsonlens__ ||
          !!first?.parent?.__jsonlens__ ||
          deletedNodes.some(n => n?.__jsonlens__ || n?.parent?.__jsonlens__);

      if (!isJson) {
        // XML delete: keep existing behavior
        detail.deletedNodes.forEach(node => {
          this.handleDelete(node);
        });
        fore?.addToBatchedNotifications(this);
        return;
      }

      // --------------------------
      // JSON routing (DO NOT use detail.ref string)
      // detail.ref is a PATH like "$data/movies[2]" for JSON deletes.
      // We must route by the deleted node's array parent.
      // --------------------------

      // array container parent emitted by fx-delete
      const eventArrayParent = detail.parent && Array.isArray(detail.parent.value) ? detail.parent : null;

      // Determine this repeat's array parent (if we currently have any nodes)
      const myFirstNode = Array.isArray(this.nodeset) ? this.nodeset[0] : null;
      const myArrayParent =
          myFirstNode?.parent && Array.isArray(myFirstNode.parent.value) ? myFirstNode.parent : null;

      // Fallback: infer the array key from this.ref (works even if repeat is empty)
      const inferArrayKeyFromRef = () => {
        const r = String(this.ref || this.getAttribute('ref') || '').trim();
        if (!r) return null;
        // expecting "...?movies?*" or "?genres?*"
        const m = r.match(/\?([^?\[\]]+)\?\*\s*$/);
        return m ? m[1] : null;
      };

      const myKey = inferArrayKeyFromRef();
      const eventKey = eventArrayParent?.keyOrIndex ?? null;

      // Match conditions:
      // 1) strongest: same array-parent object identity
      // 2) fallback: same instance + same array keyOrIndex ("movies", "genres", ...)
      const sameArray =
          (eventArrayParent && myArrayParent && eventArrayParent === myArrayParent) ||
          (eventArrayParent &&
              myKey &&
              String(eventKey) === String(myKey) &&
              String(eventArrayParent.instanceId || '') === String(detail.instanceId || ''));

      if (!sameArray) return;

      // Now actually update DOM repeat items
      this._handleJsonDeleted(detail);

      // Ensure repeat itself gets processed in the same refresh cycle (safe)
      fore?.addToBatchedNotifications(this);
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
  `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      ${html}
  `;
  }

  /**
   * JSON insert (perfect + incremental):
   * - re-evaluate nodeset once to get authoritative post-insert ordering
   * - insert one new repeatitem at the correct position (using detail.index)
   * - rebind only shifted repeatitems (pos..end) and refresh them
   */
  _handleJsonInserted(detail) {
    console.log('JSON INSERT', detail);
    console.log('JSON insertedNodes', detail.insertedNodes);
    console.log('JSON insertedParent', detail.insertedParent);

    const fore = this.getOwnerForm();

    const repeatItems = () =>
      Array.from(
        this.querySelectorAll(
          ':scope > fx-repeat-item, :scope > fx-repeatitem, :scope > .repeat-item',
        ),
      );

    // 1) Determine insertion index (1-based) from the event.
    // Do NOT use indexOf(insertedNodes) for JSON.
    let insertionIndex1 = Number(detail.index);
    if (!Number.isFinite(insertionIndex1) || insertionIndex1 < 1) {
      const ki = detail.insertedNodes?.keyOrIndex;
      if (typeof ki === 'number') insertionIndex1 = ki + 1;
    }
    if (!Number.isFinite(insertionIndex1) || insertionIndex1 < 1) insertionIndex1 = 1;

    // 2) Re-evaluate nodeset AFTER mutation to get correct order.
    const oldLen = Array.isArray(this.nodeset) ? this.nodeset.length : 0;
    this._evalNodeset();
    const newLen = Array.isArray(this.nodeset) ? this.nodeset.length : 0;
    if (newLen === oldLen) return;

    // Clamp
    insertionIndex1 = Math.max(1, Math.min(insertionIndex1, newLen));
    const pos0 = insertionIndex1 - 1;

    // 3) Insert DOM row: IMPORTANT set nodeset/index BEFORE inserting into DOM.
    const before = repeatItems();
    const beforeNode = before[pos0] ?? null;

    const newRepeatItem = this._createNewRepeatItem();
    newRepeatItem.index = pos0 + 1;
    this._initVariables(newRepeatItem);
    newRepeatItem.nodeset = this.nodeset[pos0];

    this.insertBefore(newRepeatItem, beforeNode);

    if (fore.createNodes) {
      fore.initData(newRepeatItem);
    }
    fore.scanForNewTemplateExpressionsNextRefresh();
    fore.addToBatchedNotifications(newRepeatItem);

    // 4) Rebind shifted rows (pos0+1..end) and refresh only those.
    const after = repeatItems();

    for (let i = pos0 + 1; i < after.length; i++) {
      const ri = after[i];
      ri.index = i + 1;

      // Even if identity is stable, keep it correct.
      const newNode = this.nodeset[i];
      if (ri.nodeset !== newNode) {
        ri.nodeset = newNode;
        if (fore.createNodes) fore.initData(ri);
      }

      fore.addToBatchedNotifications(ri);
    }

    // Select inserted row
    this.setIndex(pos0 + 1);
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
    const selected = rItems[this.index - 1];

    this.applyIndex(selected);

    // If setIndex is called programmatically (insert/delete), we must notify dependents
    // (fx-group/fx-control/fx-output with index('repeatId') in ref).
    //
    // When setIndex is invoked as a reaction to a repeatitem click/focus,
    // the repeatitem already dispatched item-changed and dependents already react.
    if (!this._settingIndexFromItemChanged) {
      this.dispatchEvent(
        new CustomEvent('item-changed', {
          composed: false,
          bubbles: false,
          detail: { item: selected || null, index: this.index, source: 'repeat' },
        }),
      );
    }
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
              // IMPORTANT: keep using the canonical instance returned by registerModelItem.
              // Otherwise a throwaway ModelItem can leak into observer graphs and be notified.
              modelItem = this.getModel().registerModelItem(modelItem);
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

    console.log('JSON DELETE', detail);

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
