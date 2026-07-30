/**
 * repeat-base.js — Common logic extracted from fx-repeat (kept intact) for reuse.
 *
 * IMPORTANT:
 * - fx-repeat stays exactly as-is. We do NOT change its code.
 * - This base mirrors the common logic (method names + behavior) so other repeat
 *   variants (like fx-repeat-attributes) can reuse it without duplicating code.
 *
 * Integration options (no changes to fx-repeat required):
 * - Import this file where you implement other repeat-like components and extend RepeatBase.
 * - Optionally, you may mix these methods into FxRepeat at runtime:
 *   customElements.whenDefined('fx-repeat').then(() => {
 *     Object.assign(customElements.get('fx-repeat').prototype, RepeatBase.prototype);
 *   });
 *   (Only if you really must; by default we leave FxRepeat untouched.)
 */
import { Fore } from '../fore.js';
import { evaluateXPath } from '../xpath-evaluation.js';
import { DependencyNotifyingDomFacade } from '../DependencyNotifyingDomFacade.js';
import getInScopeContext from '../getInScopeContext.js';
import { withDraggability } from '../withDraggability.js';
import { UIElement } from './UIElement.js';
import { FxBind } from '../fx-bind.js';

// Only fx-repeat-attributes.js extends this today - fx-repeat.js was intentionally left
// untouched (see above) and extends UIElement directly, not RepeatBase. Most of RepeatBase's
// own methods are in turn overridden by FxRepeatAttributes rather than reused; treat this as
// fx-repeat-attributes's base class specifically, not a shared foundation the two repeat
// variants both build on.
export class RepeatBase extends withDraggability(UIElement, false) {
  get repeatSize() {
    return this.querySelectorAll(':scope > fx-repeatitem').length;
  }

  set repeatSize(size) {
    this.size = size;
  }

  async init() {
    // ### there must be a single 'template' child

    const inited = new Promise(resolve => {
      // if(!this.inited) this.init();
      // does not use this.evalInContext as it is expecting a nodeset instead of single node
      this._evalNodeset();

      this._initTemplate();
      // this._initRepeatItems();

      this.setAttribute('index', this.index);
      this.inited = true;
      resolve('done');
    });

    return inited;
  }

  async refresh(force) {
    if (!this.inited) this.init();
    // console.time('repeat-refresh', this);
    this._evalNodeset();

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
      await Fore.refreshChildren(this, force);
    }
    // this.style.display = 'block';
    // this.style.display = this.display;
    this.setIndex(this.index);
    // console.timeEnd('repeat-refresh');

    // this.replaceWith(clone);

    // this.repeatCount = contextSize;
  }

  connectedCallback() {
    super.connectedCallback();

    // Listen for insertion events
    this.handleInsert = event => {
      const { detail } = event;

      // Step 1: Refresh/re-evaluate the nodeset
      const oldNodesetLength = this.nodeset.length;
      this._evalNodeset();
      const newNodesetLength = this.nodeset.length;
      if (oldNodesetLength === newNodesetLength) {
        return;
      }

      this._insertHandler(detail.insertedNodes);
    };

    this.getOwnerForm().addEventListener('insert', this.handleInsert);

    this.handleDelete = event => {
      const { detail } = event;
      if (!detail || !detail.deletedNodes) {
        return;
      }

      // Remove corresponding repeat items for deleted nodes
      detail.deletedNodes.forEach(node => {
        this._deleteHandler(node);
        //        this.removeRepeatItemForNode(node);
      });
      this.getOwnerForm().addToBatchedNotifications(this);
    };
    this.getOwnerForm().addEventListener('deleted', this.handleDelete);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) super.disconnectedCallback();
    this.getOwnerForm().removeEventListener('deleted', this.handleDelete);
    this.getOwnerForm().removeEventListener('insert', this.handleInsert);
  }

  /**
   * Handle an insert
   *
   * @param {Node} node
   */
  _insertHandler(node) {
    /**
     * @type {number}
     */
    const insertionIndex = this.nodeset.indexOf(node) + 1;
    // Step 2: Get current repeat items and create a new item
    // todo: search fx-bind elements with same nodeset as this repeat - if present update modelItem instead of creating one
    const newRepeatItem = this._createNewRepeatItem(insertionIndex, node);

    // Generate the parent `modelItem` for the new repeat item
    this.opNum++;
    let parentModelItem = FxBind.createModelItem(this.ref, node, this, this.opNum);
    // IMPORTANT: registerModelItem may return an existing canonical ModelItem for the same path.
    // Always keep using the returned instance to avoid "ghost" ModelItems that still notify.
    parentModelItem = this.getModel().registerModelItem(parentModelItem);
    newRepeatItem.modelItem = parentModelItem;

    this.setIndex(insertionIndex);

    // parentModelItem already registered above

    // Step 5: Create modelItems recursively for child elements
    this._createModelItemsRecursively(newRepeatItem, parentModelItem);

    // Step 6: Notify and refresh the UI
    this.getOwnerForm().scanForNewTemplateExpressionsNextRefresh();

    this.getOwnerForm().addToBatchedNotifications(newRepeatItem);
  }

  /**
   * @abstract
   *
   * @param {number} index - the one-based index of where to insert the new node
   * @param {Node} node - the new node that's inserted
   *
   * @returns {HTMLElement}
   */
  _createNewRepeatItem(index, node) {
    throw new Error('Not implemented');
  }

  setInScopeVariables(inScopeVariables) {
    // Repeats are interesting: the variables should be scoped per repeat item, they should not be
    // able to see the variables in adjacent repeat items!
    this.inScopeVariables = new Map(inScopeVariables);
  }

  /**
   * repeat has no own modelItems
   * @private
   */
  _evalNodeset() {
    // const inscope = this.getInScopeContext();
    const inscope = getInScopeContext(this.getAttributeNode('ref') || this, this.ref);
    // now we got a nodeset and attach MutationObserver to it

    if (this.mutationObserver && inscope.nodeName) {
      this.mutationObserver.observe(inscope, {
        childList: true,
        subtree: true,
      });
    }

    let touchedNodes = null;
    let domFacade = null;
    if (this._refNeedsDependencyTracking()) {
      touchedNodes = new Set();
      domFacade = new DependencyNotifyingDomFacade(node => touchedNodes.add(node));
    }

    const rawNodeset = evaluateXPath(this.ref, inscope, this, {}, {}, domFacade);

    if (touchedNodes) {
      this._trackRefDependencies(touchedNodes);
    }

    if (rawNodeset.length === 1 && Array.isArray(rawNodeset[0])) {
      // This XPath likely returned an XPath array. Just collapse to that array
      this.nodeset = rawNodeset[0];
      return;
    }
    this.nodeset = rawNodeset;
  }

  _initTemplate() {
    this.template = this.querySelector('template');
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

      //      this.appendChild(repeatItem);

      if (this.getOwnerForm().createNodes) {
        this.getOwnerForm().initData(repeatItem);
        const repeatItemClone = repeatItem.nodeset.cloneNode(true);
        this.clearTextValues(repeatItemClone);

        // this.createdNodeset = repeatItem.nodeset.cloneNode(true);
        this.createdNodeset = repeatItemClone;
      }

      if (repeatItem.index === 1) {
        this.applyIndex(repeatItem);
      }
      Fore.dispatch(this, 'item-created', { nodeset: repeatItem.nodeset, pos: index + 1 });
      this._initVariables(repeatItem);
    });
  }

  getRepeatItems() {
    return Array.from(this.querySelectorAll(':scope > fx-repeatitem'));
  }

  _deleteHandler(deleted) {
    // grab the current repeat items (tweak selector if yours differs)
    /**
     * @type {import('./fx-repeatitem.js').FxRepeatitem[]}
     */
    const items = this.getRepeatItems();

    /*
    const items = Array.from(
      this.querySelectorAll(
        ':scope > fx-repeatitem, :scope > .fx-repeatitem',
      ),
    );
*/

    this._evalNodeset();

    const indexToRemove = items.findIndex(item => item.nodeset === deleted);
    if (indexToRemove === -1) {
      return;
    }
    const itemToRemove = items[indexToRemove];

    itemToRemove.remove();

    // Make the next item the 'current'
    this.setIndex(indexToRemove + 1);
  }

  /**
   * @abstract
   */
  setIndex(index) {
    throw new Error('Not implemented');
  }

  applyIndex(repeatItem) {
    this._removeIndexMarker();
    if (repeatItem) {
      repeatItem.setAttribute('repeat-index', '');
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
      this.getModel()._setModelItemPath(
        mi,
        `${parentBaseInChildStyle}_${op}${mi.path.slice(parentBaseInChildStyle.length)}`,
      );
    };

    if (parentNode.attachObserver) {
      parentNode.attachObserver();
    }
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
              // IMPORTANT: keep using the canonical instance returned by registerModelItem.
              // Otherwise a throwaway ModelItem can leak into observer graphs and be notified.
              modelItem = this.getModel().registerModelItem(modelItem);
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
}

// Global accessor for non-module inclusion
if (typeof window !== 'undefined') {
  window.RepeatBase = window.RepeatBase || RepeatBase;
}
