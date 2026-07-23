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
import { DependencyNotifyingDomFacade } from '../DependencyNotifyingDomFacade.js';

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
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.opNum = 0; // global number of operations

    // Progressive rendering (size cap + IntersectionObserver sentinel).
    // `_sentinel !== null` is the single source of truth for "a cap is active and there
    // is more to reveal" - see _syncSentinels().
    this._sizeLimit = Infinity;
    this._renderTarget = 0;
    this._sentinel = null;
    this._sentinelObserver = null;

    // True windowed virtualization (opt-in via `virtual` attribute + `size`).
    // `_windowStart` is the 0-based logical index of the first RENDERED row; it is always 0
    // when `_virtual` is false, which is what makes every `+ this._windowStart` offset below
    // degenerate to exactly today's prefix-window math for non-virtual repeats.
    this._virtual = false;
    this._windowStart = 0;
    this._topSentinel = null;
    this._topSentinelObserver = null;

    // Continuous scroll-driven trim (virtual mode only). The sentinels only fire once the
    // window's leading/trailing edge is reached, which (given the sentinel sits at the very
    // end of whatever was just rendered) forces scrolling through almost a full window's
    // worth of content before a slide+evict happens - see _trimWindow() for why that alone
    // lets the rendered count settle well above `size`. This listener evicts confirmed
    // off-screen rows continuously as the user scrolls, so the window keeps converging on
    // `size` instead of only trimming in bursts tied to sentinel crossings.
    this._scrollTrimRoot = null;
    this._scrollTrimHandler = null;
    this._scrollTrimLastTop = 0;
    this._trimScheduled = false;

    this.handleInsertHandler = null;
    this.handleDeleteHandler = null;

    // Tracks ModelItems we observe due to JSON lens lookups inside predicate expressions
    // (e.g. instance('data')?ui?query). Needed so the repeat refreshes when the query changes.
    this._jsonPredicateDeps = new Set();
    this._jsonPredicateDepsObserved = false;

    // Flag used to suppress "programmatic index changed" notifications when setIndex()
    // is called as a direct reaction to a repeatitem's item-changed event.
    this._settingIndexFromItemChanged = false;
  }

  // ------------------------------------------------------------
  // JSON ref helpers (for routing insert/delete events correctly)
  // ------------------------------------------------------------

  _stripJsonRefToContainer(ref) {
    let s = String(ref || '').trim();
    if (!s) return '';

    // If this is a repeat nodeset ref like: instance('data')?movies?*[...]
    // strip everything from "?*" onward => instance('data')?movies
    const starPos = s.indexOf('?*');
    if (starPos >= 0) s = s.slice(0, starPos).trim();

    // Also strip trailing predicates if someone wrote ...?movies[...]
    // (not common for lens refs, but keep it safe)
    s = s.replace(/\[[\s\S]*\]\s*$/g, '').trim();

    return s;
  }

  _inferArrayKeyFromRef() {
    const r = String(this.ref || this.getAttribute('ref') || '').trim();

    // instance('data')?movies?*...
    let m = r.match(/\?([^?\[\]]+)\?\*\s*/);
    if (m) return m[1];

    // instance('data')?movies  (no ?*)
    m = r.match(/\?([^?\[\]]+)\s*$/);
    if (m) return m[1];

    return null;
  }

  _sameJsonContainer(detailRef) {
    const myContainer = this._stripJsonRefToContainer(this.ref);
    const evContainer = this._stripJsonRefToContainer(detailRef);
    if (!myContainer || !evContainer) return false;
    return myContainer === evContainer;
  }

  _matchesJsonParent(detail) {
    // Fallback routing based on insertedParent / insertedNodes.parent
    const parent =
      detail?.insertedParent ||
      detail?.insertedNodes?.parent ||
      detail?.insertedNodes?.insertedParent ||
      null;

    if (!parent || !parent.__jsonlens__) return false;

    const myKey = this._inferArrayKeyFromRef();
    if (myKey && String(parent.keyOrIndex) !== String(myKey)) return false;

    // If instance is known on both sides, ensure it matches
    const myInstanceId = XPathUtil.resolveInstance(this, this.ref);
    if (myInstanceId && parent.instanceId && String(myInstanceId) !== String(parent.instanceId)) {
      return false;
    }

    return true;
  }

  // ------------------------------------------------------------
  // Progressive rendering (size cap)
  // ------------------------------------------------------------

  _getSizeLimit() {
    const attr = this.getAttribute('size');
    if (!attr) return Infinity;
    const n = parseInt(attr, 10);
    return Number.isFinite(n) && n > 0 ? n : Infinity;
  }

  /**
   * True windowed virtualization is opt-in via `virtual`, and only meaningful together with
   * a finite `size` (which becomes the window size rather than a prefix cap). `virtual`
   * without `size` degenerates to fully uncapped, exactly like `size` being absent.
   */
  _isVirtual() {
    return this.hasAttribute('virtual') && this._getSizeLimit() !== Infinity;
  }

  /**
   * Upper bound on how many rows _evictFromTop()/_evictFromBottom() remove in a single call.
   * A quarter of `size` (floor 4) keeps a single correction small no matter how large a
   * backlog a caller asks to clear - see the comment on _evictFromTop() for why an uncapped
   * batch turns into a scroll-speed-proportional scrollTop jump. Any excess beyond this cap
   * simply drains on the next call (there always is one while scrolling continues).
   */
  _maxEvictBatch() {
    return Math.max(4, Math.ceil(this._sizeLimit / 4));
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
        // IMPORTANT FIX:
        // The old code compared detail.ref strictly to a computed container ref.
        // For repeats like instance('data')?movies?*[predicate] the container is "instance('data')?movies"
        // while detail.ref is usually exactly that container. But if we keep the predicate in this.ref,
        // a strict string compare will FAIL and the insert never updates the DOM -> stays at 12.
        //
        // We accept the event if either:
        //  1) detail.ref matches our container (predicate stripped), OR
        //  2) insertedParent / insertedNode.parent matches our array key + instance.
        const okByRef = this._sameJsonContainer(detail?.ref);
        const okByParent = this._matchesJsonParent(detail);

        if (!okByRef && !okByParent) return;

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
      const relIdx = insertionIndex - 1; // 0-based logical index of the inserted row

      const repeatItems = Array.from(
        this.querySelectorAll(
          ':scope > fx-repeat-item, :scope > fx-repeatitem, :scope > .repeat-item',
        ),
      );

      // Uncapped repeats always materialize immediately: `_renderTarget` is only resynced to
      // the full nodeset length inside refresh(), which may not have run yet between two
      // synchronous inserts, so it can't be trusted as a window boundary when uncapped.
      // Zone B (within window): today's "within window" case, offset by `_windowStart`.
      const withinWindow =
        this._sizeLimit === Infinity ||
        (relIdx >= this._windowStart && relIdx < this._renderTarget);
      // Zone A (before window): only reachable in virtual mode - `_windowStart` is always 0
      // off virtual mode, so `relIdx < 0` never holds.
      const beforeWindow = this._virtual && relIdx < this._windowStart;

      if (withinWindow) {
        const relativePos = relIdx - this._windowStart;
        const newRepeatItem = this._createNewRepeatItem();

        const beforeNode = repeatItems[relativePos] ?? this._sentinel ?? null;
        this.insertBefore(newRepeatItem, beforeNode);
        newRepeatItem.index = insertionIndex;
        this._initVariables(newRepeatItem);

        newRepeatItem.nodeset = inserted;

        for (let i = relativePos; i < repeatItems.length; ++i) {
          repeatItems[i].index += 1;
        }

        this._renderTarget += 1;
        // In virtual mode, an in-window insert momentarily grows the window past `size` -
        // evict one row from the opposite (bottom) end to restore window size. This is a
        // local, in-place insert, not a scroll-driven slide, so no scrollTop correction is
        // needed either way (known limitation: this always evicts from the bottom regardless
        // of where in the window the insert landed - see plan's "known limitation" note).
        if (this._virtual && this._renderTarget - this._windowStart > this._sizeLimit) {
          this._evictFromBottom(1);
        }
        this._syncSentinels();

        this.opNum++;
        let parentModelItem = FxBind.createModelItem(this.ref, inserted, newRepeatItem, this.opNum);
        // IMPORTANT: registerModelItem may return an existing canonical ModelItem for the same path.
        // Always keep using the returned instance to avoid "ghost" ModelItems that still notify.
        parentModelItem = this.getModel().registerModelItem(parentModelItem);
        newRepeatItem.modelItem = parentModelItem;

        this._createModelItemsRecursively(newRepeatItem, parentModelItem);

        fore.scanForNewTemplateExpressionsNextRefresh();
        fore.addToBatchedNotifications(newRepeatItem);
      } else if (beforeWindow) {
        // Zone A: inserted above the rendered window. The rendered rows are still correct
        // (same node identities) - only their logical position shifted by one. No DOM
        // change; just shift the window's bookkeeping to match.
        this._windowStart += 1;
        this._renderTarget += 1;
        this._reindexRenderedRows();
        this._syncSentinels();

        // IMPORTANT: do NOT fall through to the shared setIndex(insertionIndex) below, and do
        // NOT route the index bump through setIndex() either - both would run the
        // window-membership check and, since `this.index` (still pointing wherever it did
        // before this insert - raw scrolling never updates it, only setIndex() does) may now
        // resolve to a position outside the window we just deliberately left untouched,
        // trigger an unwanted seek-jump that destroys/rebuilds this exact window. Nothing
        // rendered actually moved (Zone A never touches DOM), so only the numeric index
        // needs to shift to keep pointing at the same logical row - update the attribute
        // directly. Known limitation: index()-dependents elsewhere in the form aren't
        // notified of this silent renumbering (no 'item-changed' dispatch) - acceptable since
        // Zone A only fires for inserts above an actively-scrolled-away window, an already
        // rare interaction.
        if (this.index >= insertionIndex) {
          this.index += 1;
        }
        return;
      }
      // else: Zone C - inserted beyond the rendered window. this.nodeset already reflects
      // the insert (re-evaluated above) - there's no DOM row to create yet. setIndex() below
      // triggers growth-on-demand (non-virtual) or a seek jump (virtual) if navigation
      // reaches that far.

      this.setIndex(insertionIndex);
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

      if (isJson) {
        // Route by parent array container, NOT by detail.ref string.
        const parent =
          (detail.parent && Array.isArray(detail.parent.value) && detail.parent) ||
          (first?.parent && Array.isArray(first.parent.value) ? first.parent : null);

        if (!parent) return;

        const myKey = this._inferArrayKeyFromRef();

        if (myKey && String(parent.keyOrIndex) !== String(myKey)) return;

        if (
          detail.instanceId &&
          parent.instanceId &&
          String(detail.instanceId) !== String(parent.instanceId)
        ) {
          return;
        }

        this._handleJsonDeleted(detail);
        return;
      }

      // XML delete: keep existing behavior
      detail.deletedNodes.forEach(node => {
        this.handleDelete(node);
      });
      fore?.addToBatchedNotifications?.(this);
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
      /* A bare <slot> renders as display:contents (layout-transparent), so demos that put
         display:flex/grid on the fx-repeat host (e.g. demo/kanban.html's #column) get their
         fx-repeatitems as direct flex/grid items. The [part=list] wrapper below must stay
         equally transparent or it becomes the sole flex/grid item and items collapse into a
         block stack inside it. role="list" survives display:contents in all supported browsers. */
      [part="list"]{
          display: contents;
      }
   `;
    // `role="list"` sits on a wrapper around the default slot only, not on the host itself:
    // a named `slot="header"` (e.g. a `<table>` used as a column header row, see demo/api.html)
    // is real, non-listitem content that would otherwise become an accessibility-tree child of
    // the list and fail axe's aria-required-children check. Keeping it outside the wrapper avoids
    // that while still giving the repeated `fx-repeatitem`s (each `role="listitem"`) a `list`
    // parent.
    const html = `
          <slot name="header"></slot>
          <div part="list" role="list"><slot></slot></div>
  `;

    const sheet = Fore.getSharedStyleSheet(style);
    if (sheet) {
      this.shadowRoot.innerHTML = html;
      this.shadowRoot.adoptedStyleSheets = [sheet];
    } else {
      this.shadowRoot.innerHTML = `
      <style>${style}</style>
      ${html}
  `;
    }
  }

  /**
   * JSON insert (incremental):
   * - re-evaluate nodeset once to get authoritative post-insert ordering
   * - insert one new repeatitem at the correct position (using detail.index)
   * - rebind only shifted repeatitems (pos..end) and refresh them
   */
  _handleJsonInserted(detail) {
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

    // See the equivalent comment in the XML insert handler above.
    const withinWindow =
      this._sizeLimit === Infinity || (pos0 >= this._windowStart && pos0 < this._renderTarget);
    const beforeWindow = this._virtual && pos0 < this._windowStart;

    if (withinWindow) {
      const relativePos = pos0 - this._windowStart;

      // 3) Insert DOM row: set nodeset/index BEFORE inserting into DOM.
      const before = repeatItems();
      const beforeNode = before[relativePos] ?? this._sentinel ?? null;

      const newRepeatItem = this._createNewRepeatItem();
      newRepeatItem.index = pos0 + 1;
      this._initVariables(newRepeatItem);
      newRepeatItem.nodeset = this.nodeset[pos0];

      this.insertBefore(newRepeatItem, beforeNode);

      // Ensure it gets initialized/rendered
      fore.registerLazyElement(newRepeatItem);
      if (fore.createNodes) {
        fore.initData(newRepeatItem);
      }
      fore.scanForNewTemplateExpressionsNextRefresh();
      fore.addToBatchedNotifications(newRepeatItem);

      this._renderTarget += 1;
      // See the equivalent comment in the XML insert handler above.
      if (this._virtual && this._renderTarget - this._windowStart > this._sizeLimit) {
        this._evictFromBottom(1);
      }
      this._syncSentinels();

      // 4) Rebind shifted rows (relativePos+1..end) and refresh only those.
      const after = repeatItems();

      for (let i = relativePos + 1; i < after.length; i++) {
        const ri = after[i];
        const logicalIdx = this._windowStart + i;
        ri.index = logicalIdx + 1;

        const newNode = this.nodeset[logicalIdx];
        if (ri.nodeset !== newNode) {
          ri.nodeset = newNode;
          if (fore.createNodes) fore.initData(ri);
        }

        fore.addToBatchedNotifications(ri);
      }
    } else if (beforeWindow) {
      // Zone A: see the equivalent comment in the XML insert handler above - must NOT go
      // through setIndex() at all (neither for pos0+1 nor for an adjusted value), since
      // `this.index` may already point outside this deliberately-untouched window (raw
      // scrolling never updates it) and setIndex()'s window-membership check would treat
      // that as an out-of-window navigation, triggering an unwanted seek-jump.
      this._windowStart += 1;
      this._renderTarget += 1;
      this._reindexRenderedRows();
      this._syncSentinels();

      // insertionIndex1 (outer scope) already equals pos0 + 1.
      if (this.index >= insertionIndex1) {
        this.index += 1;
      }
      return;
    }
    // else: Zone C - inserted beyond the rendered window - no DOM row to create, nothing to
    // rebind. setIndex() below triggers growth-on-demand (non-virtual) or a seek jump
    // (virtual) if navigation reaches that far.

    // Select inserted row
    this.setIndex(pos0 + 1);
  }

  disconnectedCallback() {
    // Ensure UIElement cleanup runs (removes observer for primary binding, etc.)
    if (super.disconnectedCallback) super.disconnectedCallback();

    // Remove observers that were added for predicate dependencies
    if (this._jsonPredicateDeps && this._jsonPredicateDeps.size) {
      for (const mi of this._jsonPredicateDeps) {
        if (mi && typeof mi.removeObserver === 'function') {
          mi.removeObserver(this);
        }
      }
      this._jsonPredicateDeps.clear();
    }
    this._jsonPredicateDepsObserved = false;

    document.removeEventListener('deleted', this.handleDeleteHandler, true);
    document.removeEventListener('insert', this.handleInsertHandler, true);

    if (this._sentinelObserver) {
      this._sentinelObserver.disconnect();
      this._sentinelObserver = null;
    }
    this._sentinel = null;

    if (this._topSentinelObserver) {
      this._topSentinelObserver.disconnect();
      this._topSentinelObserver = null;
    }
    this._topSentinel = null;

    if (this._scrollTrimHandler && this._scrollTrimRoot) {
      this._scrollTrimRoot.removeEventListener('scroll', this._scrollTrimHandler);
    }
    this._scrollTrimRoot = null;
    this._scrollTrimHandler = null;
  }

  get repeatSize() {
    return this.querySelectorAll(':scope > fx-repeatitem').length;
  }

  set repeatSize(size) {
    if (!size) {
      this.removeAttribute('size');
    } else {
      this.setAttribute('size', size);
    }
  }

  setIndex(index, notifyDependents = true) {
    this.index = index;

    if (this._sizeLimit !== Infinity && Number.isFinite(index) && index >= 1) {
      if (this._virtual) {
        // Sliding window: navigation to an index outside the window can't be front-filled
        // (there's no stable prefix to grow from) - it's a hard jump instead. See
        // _seekWindowTo(). Navigation to an index already inside the window is a no-op here.
        const logicalIdx = index - 1;
        const inWindow = logicalIdx >= this._windowStart && logicalIdx < this._renderTarget;
        if (!inWindow) this._seekWindowTo(logicalIdx);
      } else {
        // Growth-on-demand: navigation (keyboard, index('id') dependents, programmatic) to
        // an index beyond the currently rendered window front-fills up through it.
        this._growRenderTarget(index);
      }
    }

    const rItems = this.querySelectorAll(':scope > fx-repeatitem');
    const selected = rItems[this.index - 1 - this._windowStart];

    this.applyIndex(selected);

    // If setIndex is called programmatically (insert/delete), we must notify dependents
    // (fx-group/fx-control/fx-output with index('repeatId') in ref).
    //
    // When setIndex is invoked as a reaction to a repeatitem click/focus,
    // the repeatitem already dispatched item-changed and dependents already react.
    // refresh() passes notifyDependents=false when neither the index nor the node at
    // the index changed — a repeat refresh alone is not an index change.
    if (!this._settingIndexFromItemChanged && notifyDependents) {
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

      this.getModel()._setModelItemPath(
        mi,
        `${parentBaseInChildStyle}_${op}${mi.path.slice(parentBaseInChildStyle.length)}`,
      );
    };

    Array.from(parentNode.children).forEach(child => {
      const nextParentMI = parentModelItem;

      const isWidgetEl =
        child &&
        ((child.classList && child.classList.contains('widget')) ||
          (typeof Fore !== 'undefined' && Fore.isWidget && Fore.isWidget(child)) ||
          (child.tagName &&
            ['INPUT', 'SELECT', 'TEXTAREA', 'OPTION', 'DATALIST'].includes(child.tagName)));

      // A nested <fx-repeat> (statically authored, or synthesized by
      // <fx-repeat-ref>) owns creating ModelItems for its own descendants once
      // it materializes them - this generic walk must not register a
      // ModelItem for it (it would leak a spurious entry keyed to the first
      // matching child) nor recurse into markup it doesn't own yet.
      const ownsOwnModelItems = child?.tagName === 'FX-REPEAT';

      if (!isWidgetEl && !ownsOwnModelItems && child.hasAttribute('ref')) {
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

      if (!isWidgetEl && !ownsOwnModelItems) this._createModelItemsRecursively(child, nextParentMI);
    });
  }

  _handleJsonDeleted(detail) {
    const fore = this.getOwnerForm();

    const repeatItems = () =>
      Array.from(
        this.querySelectorAll(
          ':scope > fx-repeat-item, :scope > fx-repeatitem, :scope > .repeat-item',
        ),
      );

    let indices0 = Array.isArray(detail.deletedIndexes0)
      ? detail.deletedIndexes0.slice()
      : Array.from(detail.deletedNodes || [])
          .map(n => (n && typeof n.keyOrIndex === 'number' ? n.keyOrIndex : -1))
          .filter(i => i >= 0);

    indices0 = Array.from(new Set(indices0)).sort((a, b) => b - a);
    if (indices0.length === 0) return;

    let currentIndex1 = Number(this.getAttribute('index') || this.index || 1);
    if (!Number.isFinite(currentIndex1) || currentIndex1 < 1) currentIndex1 = 1;

    const deletedIdx1Asc = indices0.map(i0 => i0 + 1).sort((a, b) => a - b);
    let nextIndex1 = currentIndex1;
    for (const d1 of deletedIdx1Asc) {
      if (nextIndex1 > d1) nextIndex1 -= 1;
    }

    // Three-zone split against [_windowStart, _renderTarget), using PRE-delete indices
    // (indices0 already are pre-delete, via detail.deletedIndexes0 - no ordering hazard here,
    // unlike the XML path's handleDelete()).
    const before = repeatItems();
    let windowShiftFromAbove = 0; // count of Zone-A deletions (above the window)
    let renderedRemovedCount = 0; // count of Zone-B deletions (actually rendered)

    for (const idx0 of indices0) {
      if (idx0 < this._windowStart) {
        // Zone A: above window - rendered rows unaffected, window floor shifts down by one.
        windowShiftFromAbove += 1;
      } else if (idx0 < this._renderTarget) {
        // Zone B: rendered.
        const domPos = idx0 - this._windowStart;
        const itemEl = before[domPos];
        if (itemEl) {
          try {
            fore?.unRegisterLazyElement?.(itemEl);
          } catch (_e) {}

          itemEl.remove();
          renderedRemovedCount += 1;
        }
      }
      // else: Zone C - below window, no DOM row.
    }

    this._evalNodeset();

    this._windowStart = Math.max(0, this._windowStart - windowShiftFromAbove);
    this._renderTarget = this._windowStart + (before.length - renderedRemovedCount);
    const totalAfterDelete = Array.isArray(this.nodeset) ? this.nodeset.length : 0;
    this._renderTarget = Math.min(this._renderTarget, totalAfterDelete);

    // Virtual mode: a mid-window delete is not a scroll event - the user still expects a
    // full window, so backfill from the tail if more nodeset remains below.
    if (this._virtual) {
      const deficit = this._sizeLimit - (this._renderTarget - this._windowStart);
      if (deficit > 0 && this._renderTarget < totalAfterDelete) {
        this._slideWindowDown(deficit);
      }
    }
    this._syncSentinels();

    // Rebind every currently rendered row to its (possibly shifted) logical node. The
    // `ri.nodeset !== newNode` guard below makes this cheap for rows that didn't move.
    const after = repeatItems();
    for (let i = 0; i < after.length; i++) {
      const ri = after[i];
      const logicalIdx = this._windowStart + i;
      ri.index = logicalIdx + 1;

      const newNode = Array.isArray(this.nodeset) ? this.nodeset[logicalIdx] : null;
      if (ri.nodeset !== newNode) {
        ri.nodeset = newNode;
        if (fore?.createNodes) fore.initData(ri);
      }

      fore?.addToBatchedNotifications?.(ri);
    }

    // Clamp against the LOGICAL total, not the rendered DOM count - under a size cap the two
    // differ, and clamping to the rendered count would make it impossible to navigate to a
    // not-yet-rendered logical index (setIndex()'s own growth-on-demand/seek-jump handles
    // materializing it).
    if (totalAfterDelete === 0) {
      this.setAttribute('index', '0');
      this.index = 0;
      this._removeIndexMarker?.();
      return;
    }

    nextIndex1 = Math.max(1, Math.min(nextIndex1, totalAfterDelete));
    this.setIndex(nextIndex1);
  }

  handleDelete(deleted) {
    // Captured BEFORE _evalNodeset() runs below, so it reflects the PRE-delete logical
    // position - needed to distinguish "deleted row was above the window" (Zone A) from
    // "deleted row was below the window" (Zone C) when the row isn't found among rendered
    // items. (_evalNodeset() already reflects the post-delete instance state by the time
    // this handler runs, since the model mutation happens before the 'deleted' event fires.)
    const priorIdx = Array.isArray(this.nodeset) ? this.nodeset.indexOf(deleted) : -1;

    const items = Array.from(
      this.querySelectorAll(
        ':scope > fx-repeat-item, :scope > fx-repeatitem, :scope > .repeat-item',
      ),
    );

    this._evalNodeset();

    const total = Array.isArray(this.nodeset) ? this.nodeset.length : 0;

    const indexToRemove = items.findIndex(item => item.nodeset === deleted);
    if (indexToRemove === -1) {
      if (this._virtual && priorIdx >= 0 && priorIdx < this._windowStart) {
        // Zone A: deleted row was above the window - rendered rows unaffected (same node
        // identities), only their logical position shifted down by one. No DOM change;
        // shift the window's bookkeeping and current index to match (mirrors the XML
        // insert handler's Zone-A shift, in reverse). Deliberately does NOT call setIndex()
        // - see the equivalent comment on the insert side re: `this.index` possibly already
        // being outside this deliberately-untouched window (raw scrolling never updates it),
        // which would make setIndex()'s window-membership check trigger an unwanted seek.
        this._windowStart = Math.max(0, this._windowStart - 1);
        this._renderTarget = Math.max(this._windowStart, this._renderTarget - 1);
        this._reindexRenderedRows();
        this._syncSentinels();
        this.index = Math.max(1, this.index - 1);
        return;
      }
      // Zone C (or non-virtual beyond-window): deleted node was never rendered - no DOM row
      // to remove, but the window ceiling may now exceed the shrunk nodeset.
      this._renderTarget = Math.min(this._renderTarget, total);
      this._syncSentinels();
      return;
    }

    // Zone B: rendered.
    const itemToRemove = items[indexToRemove];
    itemToRemove.remove();

    this._renderTarget = Math.max(this._windowStart, this._renderTarget - 1);
    // Virtual mode: a mid-window delete is not a scroll event - the user still expects a
    // full window, so backfill from the tail if more nodeset remains below.
    if (this._virtual) {
      const deficit = this._sizeLimit - (this._renderTarget - this._windowStart);
      if (deficit > 0 && this._renderTarget < total) {
        this._slideWindowDown(deficit);
      }
    }
    this._syncSentinels();

    // Clamp against the LOGICAL total, not the rendered DOM count - see the equivalent
    // comment in _handleJsonDeleted above.
    let nextIndex = this._windowStart + indexToRemove + 1;
    if (total === 0) {
      nextIndex = 0;
    } else if (nextIndex > total) {
      nextIndex = total;
    }

    this.setIndex(nextIndex);
  }

  _createNewRepeatItem() {
    const newItem = document.createElement('fx-repeatitem');

    if (this.isDraggable) {
      newItem.setAttribute('draggable', 'true');
      newItem.setAttribute('tabindex', 0);
    }
    if (this.dropScope) {
      newItem.setAttribute('drop-scope', this.dropScope);
    }
    const clone = this._clone();
    newItem.appendChild(clone);

    return newItem;
  }

  _materializeRepeatItem(position) {
    const newItem = this._createNewRepeatItem();
    this.insertBefore(newItem, this._sentinel || null);
    this._initVariables(newItem);
    newItem.nodeset = this.nodeset[position - 1];
    newItem.index = position;
    return newItem;
  }

  /**
   * Grows the rendered window up to (at most) `desired` logical positions, materializing
   * any not-yet-rendered rows in between. Used by the sentinel intersection callback and
   * by setIndex() to front-fill on-demand navigation beyond the current window.
   */
  _growRenderTarget(desired) {
    const total = Array.isArray(this.nodeset) ? this.nodeset.length : 0;
    const newTarget = Math.max(this._renderTarget, Math.min(desired, total));
    if (newTarget === this._renderTarget) return;

    const fore = this.getOwnerForm();
    for (let position = this._renderTarget + 1; position <= newTarget; position += 1) {
      const newItem = this._materializeRepeatItem(position);
      if (fore.createNodes) {
        fore.initData(newItem);
      }
      fore.scanForNewTemplateExpressionsNextRefresh();
      fore.registerLazyElement(newItem);
      newItem.refresh(true);
      Fore.dispatch(this, 'item-created', { nodeset: newItem.nodeset, pos: position });
    }
    this._renderTarget = newTarget;
    this._syncSentinels();
  }

  /**
   * Renumbers .index on every currently rendered row to match its logical position
   * (_windowStart + DOM offset). Needed after any operation that shifts _windowStart
   * without individually touching every row's index (prepend, eviction, Zone-A shifts).
   */
  _reindexRenderedRows() {
    const rows = this.querySelectorAll(':scope > fx-repeatitem');
    rows.forEach((row, i) => {
      row.index = this._windowStart + i + 1;
    });
  }

  /**
   * Evicts up to `count` rows from the top of the rendered window, correcting scrollTop by
   * the EXACT measured height of the removed rows (not an estimate) so the still-visible
   * content doesn't visually jump. Only meaningful in virtual mode.
   *
   * Only rows CONFIRMED already scrolled a safe margin above the visible viewport are
   * evicted, even if that's fewer than `count` - a bottom-sentinel intersection only proves
   * the user has scrolled near the bottom of the currently rendered content, not that
   * they've scrolled past every row in the leading edge. Evicting unconditionally would
   * remove rows the user is still looking at, forcing a scrollTop correction bigger than the
   * current scroll position (clamped to 0) and visibly yanking the viewport.
   *
   * The `_EVICT_MARGIN_PX` buffer is what keeps the freshly-created top sentinel (inserted
   * right after eviction, at the new window's start) genuinely off-screen rather than
   * exactly at the viewport boundary: without it, the scrollTop correction above would land
   * precisely where content ends and the new sentinel begins, and the sentinel's very first
   * IntersectionObserver reading (which reports the CURRENT state, not just future changes)
   * would immediately report it as visible - triggering an instant slide back up and
   * oscillating forever. Leaving this margin of already-scrolled-past content unevicted
   * means the sentinel ends up genuinely above the fold, only intersecting once the user
   * scrolls up for real.
   */
  _evictFromTop(count) {
    const EVICT_MARGIN_PX = 100;
    // Bounded regardless of how large a deficit the caller asks to clear in one go: a fast
    // scroll (or a long stretch since the last trim) can hand this a large `count`, and since
    // eviction here is corrected by an immediate scrollTop jump of the exact removed height,
    // an uncapped batch means an uncapped, scroll-speed-proportional jump - the faster you
    // scroll, the heftier the correction. Capping the batch keeps each single correction small
    // and roughly constant; any remainder simply drains on the next trim/slide call (there's
    // always a next one while scrolling continues, via _trimWindow's own scroll listener).
    const boundedCount = Math.min(count, this._maxEvictBatch());
    const scrollRoot =
      this._findSentinelRoot() || document.scrollingElement || document.documentElement;
    const containerTop =
      scrollRoot && scrollRoot.getBoundingClientRect ? scrollRoot.getBoundingClientRect().top : 0;

    const candidates = Array.from(this.querySelectorAll(':scope > fx-repeatitem')).slice(
      0,
      boundedCount,
    );
    const rows = [];
    for (const row of candidates) {
      if (row.getBoundingClientRect().bottom <= containerTop - EVICT_MARGIN_PX) rows.push(row);
      else break;
    }
    if (rows.length === 0) return;

    const removedHeight =
      rows[rows.length - 1].getBoundingClientRect().bottom - rows[0].getBoundingClientRect().top;
    // Captured BEFORE removal: removing the rows shrinks scrollHeight immediately, and the
    // browser auto-clamps scrollTop to the new (smaller) max as a side effect of that DOM
    // mutation - reading scrollTop again afterward (e.g. via `-=`) would read the
    // ALREADY-CLAMPED value and double-subtract from it, overshooting past 0.
    const scrollTopBeforeRemoval = scrollRoot ? scrollRoot.scrollTop : 0;

    const fore = this.getOwnerForm();
    rows.forEach(row => {
      fore.unRegisterLazyElement(row);
      row.remove();
    });

    this._windowStart += rows.length;
    if (scrollRoot) scrollRoot.scrollTop = scrollTopBeforeRemoval - removedHeight;
    this._reindexRenderedRows();
  }

  /**
   * Evicts up to `count` rows from the bottom of the rendered window. Symmetric safety check
   * to _evictFromTop: only rows CONFIRMED already below the visible viewport are evicted, so
   * a row the user is currently looking at never disappears out from under them. No scrollTop
   * correction is needed here - removing confirmed-below-the-fold content doesn't shift what's
   * currently shown.
   */
  _evictFromBottom(count) {
    // See the equivalent comment in _evictFromTop - same batch cap, kept symmetric even
    // though this particular eviction needs no scrollTop correction, so a single very large
    // batch here is cheap on its own; the cap mainly keeps top/bottom behavior consistent.
    const boundedCount = Math.min(count, this._maxEvictBatch());
    const scrollRoot =
      this._findSentinelRoot() || document.scrollingElement || document.documentElement;
    // scrollRoot always resolves to a real element (document.documentElement is the final
    // fallback), so this always has a getBoundingClientRect - no further fallback needed.
    const containerBottom = scrollRoot.getBoundingClientRect().bottom;

    const allRows = Array.from(this.querySelectorAll(':scope > fx-repeatitem'));
    const candidates = allRows.slice(-boundedCount);
    const rows = [];
    for (let i = candidates.length - 1; i >= 0; i -= 1) {
      const row = candidates[i];
      if (row.getBoundingClientRect().top >= containerBottom) rows.unshift(row);
      else break;
    }
    if (rows.length === 0) return;

    const fore = this.getOwnerForm();
    rows.forEach(row => {
      fore.unRegisterLazyElement(row);
      row.remove();
    });

    this._renderTarget -= rows.length;
  }

  /**
   * Virtual-mode bottom-sentinel response: appends the next `count` logical rows below the
   * current window, then evicts from the top to bring the rendered count back down to
   * `_sizeLimit`. The evict count is derived (not assumed equal to `count`) because the
   * window may not have reached full size yet (e.g. very first slide after initial load).
   */
  _slideWindowDown(count) {
    const total = Array.isArray(this.nodeset) ? this.nodeset.length : 0;
    const oldEnd = this._renderTarget;
    const newEnd = Math.min(oldEnd + count, total);
    if (newEnd === oldEnd) return;

    const fore = this.getOwnerForm();
    for (let logicalIdx = oldEnd; logicalIdx < newEnd; logicalIdx += 1) {
      const newItem = this._materializeRepeatItem(logicalIdx + 1);
      if (fore.createNodes) fore.initData(newItem);
      fore.scanForNewTemplateExpressionsNextRefresh();
      fore.registerLazyElement(newItem);
      newItem.refresh(true);
      Fore.dispatch(this, 'item-created', { nodeset: newItem.nodeset, pos: logicalIdx + 1 });
    }
    this._renderTarget = newEnd;

    // Deliberately NOT capped at `newEnd - oldEnd` (the count just added): a previous slide
    // may have under-evicted (its rows weren't yet confirmed off-screen per _evictFromTop's
    // safety margin), leaving a backlog above `_sizeLimit`. Requesting the full deficit here
    // lets that backlog catch up once those rows really are off-screen, instead of the excess
    // being locked in forever at whatever a single partial eviction left behind.
    const currentRendered = this._renderTarget - this._windowStart;
    const evictCount = Math.max(0, currentRendered - this._sizeLimit);
    if (evictCount > 0) this._evictFromTop(evictCount);

    this._syncSentinels();
  }

  /**
   * Virtual-mode top-sentinel response: prepends the previous `count` logical rows above the
   * current window, then evicts from the bottom to bring the rendered count back down to
   * `_sizeLimit`. Rows are created in ASCENDING logical order and inserted before a single
   * anchor node captured once before the loop - this builds correct DOM order in one pass
   * without recomputing the anchor (e.g. via repeated querySelector) on every iteration.
   *
   * Prepending content ABOVE the current scroll position pushes the previously-visible
   * content further down the document without changing scrollTop, which would otherwise
   * make the viewport appear to jump to different (earlier) content. Corrected the same way
   * _evictFromTop() corrects for removal: capture scrollTop BEFORE the mutation, measure the
   * EXACT height of what was just inserted, and set the new absolute scrollTop afterward
   * (not `+=`, which - mirroring the eviction fix - could read a value already perturbed by
   * the DOM mutation itself).
   */
  _slideWindowUp(count) {
    const oldStart = this._windowStart;
    const target = Math.max(0, oldStart - count);
    if (target === oldStart) return;

    // Bounded the same way _evictFromTop()/_evictFromBottom() are (see _maxEvictBatch()): a
    // single sentinel trigger requests sliding back a whole `size` worth at once, which would
    // otherwise prepend that many rows and correct scrollTop forward by their full combined
    // height in one jump. Prepending (and correcting for) only a small batch per call keeps
    // any single jump small; the remainder is picked up by the requestAnimationFrame
    // continuation below, converging to the same end state over a few frames instead of one.
    const batch = Math.min(oldStart - target, this._maxEvictBatch());
    const newStart = oldStart - batch;

    const scrollRoot =
      this._findSentinelRoot() || document.scrollingElement || document.documentElement;
    const scrollTopBeforeInsert = scrollRoot ? scrollRoot.scrollTop : 0;

    const fore = this.getOwnerForm();
    const anchor =
      (this._topSentinel && this._topSentinel.nextSibling) ||
      this.firstElementChild ||
      this._sentinel ||
      null;

    const insertedItems = [];
    for (let logicalIdx = newStart; logicalIdx < oldStart; logicalIdx += 1) {
      const newItem = this._createNewRepeatItem();
      this.insertBefore(newItem, anchor);
      this._initVariables(newItem);
      newItem.nodeset = this.nodeset[logicalIdx];
      newItem.index = logicalIdx + 1;
      if (fore.createNodes) fore.initData(newItem);
      fore.scanForNewTemplateExpressionsNextRefresh();
      fore.registerLazyElement(newItem);
      newItem.refresh(true);
      Fore.dispatch(this, 'item-created', { nodeset: newItem.nodeset, pos: logicalIdx + 1 });
      insertedItems.push(newItem);
    }
    this._windowStart = newStart;
    this._reindexRenderedRows();

    if (insertedItems.length > 0 && scrollRoot) {
      const insertedHeight =
        insertedItems[insertedItems.length - 1].getBoundingClientRect().bottom -
        insertedItems[0].getBoundingClientRect().top;
      scrollRoot.scrollTop = scrollTopBeforeInsert + insertedHeight;
    }

    // See the equivalent comment in _slideWindowDown - deliberately not capped at
    // `oldStart - newStart` so a prior partial eviction's backlog can catch up here too.
    const currentRendered = this._renderTarget - this._windowStart;
    const evictCount = Math.max(0, currentRendered - this._sizeLimit);
    if (evictCount > 0) this._evictFromBottom(evictCount);

    this._syncSentinels();

    // Batch was capped above (`batch < oldStart - target`): more prepending was requested
    // than this call actually performed, so continue on the next frame instead of waiting for
    // the top sentinel to re-cross (it may not - it's likely still off-screen after only a
    // partial slide, so no new IntersectionObserver trigger would ever arrive on its own).
    const remaining = newStart - target;
    if (remaining > 0) {
      requestAnimationFrame(() => this._slideWindowUp(remaining));
    }
  }

  /**
   * Hard jump: destroys the entire current window and renders a fresh one starting at
   * `logicalIdx` (start-at-target, not center-on-target - simpler, matches the roadmap's
   * wording, and avoids asymmetric clamping near either end of the nodeset that centering
   * would require anyway), then resets scroll position to the top of the fresh window. Used
   * when navigation (setIndex, an index('id') dependent, an insert/append past the window)
   * targets a logical index outside the current window - no smooth-scroll illusion, no
   * incremental front-fill (that's Phase-1's answer and doesn't fit a sliding window).
   */
  _seekWindowTo(logicalIdx) {
    const total = Array.isArray(this.nodeset) ? this.nodeset.length : 0;
    const size = this._sizeLimit;

    const newStart = Math.max(0, Math.min(logicalIdx, Math.max(0, total - size)));
    const newEnd = Math.min(total, newStart + size);

    const fore = this.getOwnerForm();
    this.querySelectorAll(':scope > fx-repeatitem').forEach(item => {
      fore.unRegisterLazyElement(item);
      item.remove();
    });
    if (this._topSentinel) this._destroyTopSentinel();
    if (this._sentinel) this._destroySentinel();

    this._windowStart = newStart;
    this._renderTarget = newEnd;
    for (let li = newStart; li < newEnd; li += 1) {
      const newItem = this._materializeRepeatItem(li + 1);
      if (fore.createNodes) fore.initData(newItem);
      fore.scanForNewTemplateExpressionsNextRefresh();
      fore.registerLazyElement(newItem);
      newItem.refresh(true);
      Fore.dispatch(this, 'item-created', { nodeset: newItem.nodeset, pos: li + 1 });
    }
    this._syncSentinels();

    const scrollRoot =
      this._findSentinelRoot() || document.scrollingElement || document.documentElement;
    if (scrollRoot) scrollRoot.scrollTop = 0;
  }

  _createSentinel() {
    const sentinel = document.createElement('div');
    sentinel.className = 'fx-repeat-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    // Needs a real box for IntersectionObserver geometry, so it can't be display:contents
    // like fx-repeat/fx-repeatitem typically are in grid/flex host layouts. Kept visually
    // negligible; host pages using CSS grid directly on fx-repeat's light DOM may need to
    // give `.fx-repeat-sentinel` a `grid-column` override.
    sentinel.style.cssText = 'height:1px;pointer-events:none;';
    this.appendChild(sentinel);
    this._sentinel = sentinel;

    if (!this._sentinelObserver) {
      // An explicit root pointing at the nearest scrollable ancestor, not root:null (the
      // implicit viewport), is required: root:null does not reliably re-fire when only a
      // *nested* scrollable container scrolls (verified reproducible in headless Chrome and
      // Electron - the top-level viewport itself never changes, so the browser doesn't
      // always re-evaluate intersection for a target clipped by an inner scroll container).
      // Falls back to null when no scrollable ancestor exists, i.e. the whole page scrolls.
      this._sentinelObserver = new IntersectionObserver(
        entries => this._onSentinelIntersect(entries),
        {
          root: this._findSentinelRoot(),
          rootMargin: '0px',
          threshold: 0,
        },
      );
    }
    this._sentinelObserver.observe(sentinel);
  }

  _findSentinelRoot() {
    let node = this.parentNode;
    while (node) {
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && node.host) {
        node = node.host;
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE || node === document.documentElement) {
        node = node.parentNode;
        continue;
      }
      const style = getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) || /(auto|scroll)/.test(style.overflow)) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  _destroySentinel() {
    if (this._sentinelObserver && this._sentinel) {
      this._sentinelObserver.unobserve(this._sentinel);
    }
    if (this._sentinel) {
      this._sentinel.remove();
      this._sentinel = null;
    }
  }

  /**
   * Leading sentinel, symmetric to _createSentinel()/_destroySentinel() but placed as the
   * first child instead of appended, and only ever active in virtual (windowed) mode - it
   * signals "there is more nodeset above the rendered window", triggering a prepend+evict-
   * from-bottom slide instead of the trailing sentinel's append+evict-from-top slide.
   */
  _createTopSentinel() {
    const sentinel = document.createElement('div');
    sentinel.className = 'fx-repeat-sentinel fx-repeat-sentinel-top';
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'height:1px;pointer-events:none;';
    this.insertBefore(sentinel, this.firstElementChild || null);
    this._topSentinel = sentinel;

    if (!this._topSentinelObserver) {
      this._topSentinelObserver = new IntersectionObserver(
        entries => this._onTopSentinelIntersect(entries),
        {
          root: this._findSentinelRoot(),
          rootMargin: '0px',
          threshold: 0,
        },
      );
    }
    this._topSentinelObserver.observe(sentinel);
  }

  _destroyTopSentinel() {
    if (this._topSentinelObserver && this._topSentinel) {
      this._topSentinelObserver.unobserve(this._topSentinel);
    }
    if (this._topSentinel) {
      this._topSentinel.remove();
      this._topSentinel = null;
    }
  }

  /**
   * Ensures the trailing sentinel exists iff a size cap is active and there are still
   * unrendered rows left, and (virtual mode only) the leading sentinel exists iff the window
   * has scrolled past the start of the nodeset. Called after every operation that can change
   * _renderTarget, _windowStart, or the nodeset length.
   */
  _syncSentinels() {
    this._syncBottomSentinel();
    this._syncTopSentinel();
    this._ensureScrollTrimListener();
  }

  /**
   * Suppresses the browser's native overscroll/rubber-band bounce on the actual scrolling
   * ancestor, for ANY size-capped repeat - progressive rendering included, not just `virtual`.
   * Both flavors can find themselves genuinely at the end of currently-rendered content while
   * the user is still actively (momentum-)scrolling toward it - virtual mode via eviction
   * shrinking the scrollable height out from under the scroll, progressive rendering simply
   * because the next chunk hasn't been appended yet when the sentinel fires - and either one
   * can trigger a visible bounce (briefly showing whatever is behind the container) right at
   * that edge. This can't live in a shared stylesheet - the scrolling ancestor is whatever
   * element the HOST PAGE gave `overflow: auto/scroll`, under any class name, so there's no
   * fixed selector to hang it on. Setting it here, on the same element _findSentinelRoot()
   * already resolves for virtual mode's scrollTop corrections, makes it automatic for any
   * capped repeat regardless of the page's own markup - no CSS to remember. Deliberately
   * excludes the whole-page fallback (no nested scrollable ancestor found): suppressing
   * overscroll for the entire document would be a surprising side effect on a page that also
   * scrolls for reasons unrelated to this repeat. Also skipped if the page already set this
   * explicitly - never override an intentional choice.
   */
  _ensureOverscrollFix() {
    if (this._sizeLimit === Infinity) return;

    const root = this._findSentinelRoot();
    if (root && getComputedStyle(root).overscrollBehaviorY === 'auto') {
      root.style.overscrollBehavior = 'none';
    }
  }

  /**
   * Lazily attaches a 'scroll' listener on the nearest scrollable ancestor (virtual mode
   * only) that keeps trimming the rendered window toward `size` as the user scrolls - see
   * _trimWindow(). Re-attaches if the scrollable ancestor changes (e.g. repeat reparented)
   * and detaches entirely once virtual mode is off.
   */
  _ensureScrollTrimListener() {
    this._ensureOverscrollFix();

    if (!this._virtual) {
      if (this._scrollTrimHandler && this._scrollTrimRoot) {
        this._scrollTrimRoot.removeEventListener('scroll', this._scrollTrimHandler);
      }
      this._scrollTrimRoot = null;
      this._scrollTrimHandler = null;
      return;
    }

    const root = this._findSentinelRoot() || document.scrollingElement || document.documentElement;
    if (root === this._scrollTrimRoot && this._scrollTrimHandler) return;

    if (this._scrollTrimHandler && this._scrollTrimRoot) {
      this._scrollTrimRoot.removeEventListener('scroll', this._scrollTrimHandler);
    }

    this._scrollTrimRoot = root;
    this._scrollTrimLastTop = root ? root.scrollTop : 0;
    this._scrollTrimHandler = () => {
      if (this._trimScheduled) return;
      this._trimScheduled = true;
      requestAnimationFrame(() => {
        this._trimScheduled = false;
        const cur = this._scrollTrimRoot ? this._scrollTrimRoot.scrollTop : 0;
        const direction = cur - this._scrollTrimLastTop;
        this._scrollTrimLastTop = cur;
        this._trimWindow(direction);
      });
    };
    root.addEventListener('scroll', this._scrollTrimHandler, { passive: true });
  }

  /**
   * Evicts whatever is currently safely off-screen (top or bottom, via the same
   * margin-guarded checks _slideWindowDown()/_slideWindowUp() already use) whenever the
   * rendered count exceeds `size`. Sentinels alone only trigger a slide once the window's
   * edge is reached - by which point almost a full window of content has already scrolled
   * by - so the rendered count settles at roughly `size + one viewport's worth` instead of
   * `size`. Running this continuously on scroll lets the excess drain away in small
   * increments as it becomes confirmed off-screen, well before the next sentinel crossing.
   *
   * `direction` (signed scrollTop delta since the last call, 0 if unknown) picks a SINGLE
   * side to evict from, matching which side is actually accumulating stale rows: scrolling
   * down (positive) only makes rows above stale, scrolling up (negative) only makes rows
   * below stale. Trying both sides unconditionally is wrong, not just redundant - while
   * scrolling up specifically to shrink `_windowStart` back toward 0 (e.g. _slideWindowUp
   * prepending rows), any leftover excess (from _evictFromBottom's own per-call batch cap
   * not yet having caught up) would otherwise get partially evicted from the top here,
   * incrementing `_windowStart` right back up and undoing part of the very prepend that
   * just ran - directly fighting the scroll-up convergence instead of assisting it.
   */
  _trimWindow(direction = 0) {
    if (!this._virtual) return;

    let excess = this._renderTarget - this._windowStart - this._sizeLimit;
    if (excess <= 0) return;

    let evictedFromTop = 0;
    let evictedFromBottom = 0;

    if (direction < 0) {
      const endBefore = this._renderTarget;
      this._evictFromBottom(excess);
      evictedFromBottom = endBefore - this._renderTarget;
      excess -= evictedFromBottom;
    } else {
      const startBefore = this._windowStart;
      this._evictFromTop(excess);
      evictedFromTop = this._windowStart - startBefore;
      excess -= evictedFromTop;
    }

    this._syncSentinels();

    // `_evictFromTop`/`_evictFromBottom` cap themselves to a small batch per call (see
    // _maxEvictBatch()), so a large backlog (e.g. after a very fast scroll) needs several
    // passes to fully drain. While there's more to evict AND this pass actually made
    // progress, keep draining on the next animation frame rather than waiting for another
    // 'scroll' event that may never come if the user has already stopped scrolling. Stop
    // once a pass evicts nothing - the remainder isn't confirmed off-screen yet, and will
    // be picked up by the scroll listener once it is.
    if (excess > 0 && (evictedFromTop > 0 || evictedFromBottom > 0)) {
      requestAnimationFrame(() => this._trimWindow(direction));
    }
  }

  _syncBottomSentinel() {
    const total = Array.isArray(this.nodeset) ? this.nodeset.length : 0;
    const needsSentinel = this._sizeLimit !== Infinity && this._renderTarget < total;

    if (needsSentinel && !this._sentinel) {
      this._createSentinel();
    } else if (!needsSentinel && this._sentinel) {
      this._destroySentinel();
    } else if (needsSentinel && this._sentinel && this.lastElementChild !== this._sentinel) {
      this.appendChild(this._sentinel);
    }
  }

  /**
   * Only ever active in virtual mode (`_windowStart` is always 0 off virtual mode, so
   * `needsTop` is always false there) - signals there is unrendered nodeset above the window.
   */
  _syncTopSentinel() {
    const needsTop = this._virtual && this._windowStart > 0;

    if (needsTop && !this._topSentinel) {
      this._createTopSentinel();
    } else if (!needsTop && this._topSentinel) {
      this._destroyTopSentinel();
    } else if (needsTop && this._topSentinel && this.firstElementChild !== this._topSentinel) {
      this.insertBefore(this._topSentinel, this.firstElementChild);
    }
  }

  _onSentinelIntersect(entries) {
    const last = entries[entries.length - 1];
    if (!last || !last.isIntersecting) return;
    if (this._virtual) {
      this._slideWindowDown(this._sizeLimit);
    } else {
      this._growRenderTarget(this._renderTarget + this._sizeLimit);
    }
  }

  _onTopSentinelIntersect(entries) {
    const last = entries[entries.length - 1];
    if (!last || !last.isIntersecting) return;
    if (this._windowStart <= 0) return;
    this._slideWindowUp(this._sizeLimit);
  }

  init() {
    this._evalNodeset();
    this._initTemplate();
    this._initRepeatItems();

    this.setAttribute('index', this.index);
    this.inited = true;
  }

  _observeJsonPredicateDependencies(contextNode) {
    if (this._jsonPredicateDepsObserved) return;

    const ref = String(this.ref || this.getAttribute('ref') || '').trim();
    if (!ref || !ref.includes('[') || !ref.includes('?')) return;

    const model = this.getModel && this.getModel();
    if (!model) return;

    // Collect predicate bodies [...]
    const predicates = [];
    const predRe = /\[([\s\S]+?)\]/g;
    let pm;
    while ((pm = predRe.exec(ref)) !== null) {
      if (pm[1]) predicates.push(pm[1]);
    }
    if (predicates.length === 0) return;

    const isBoundary = ch =>
      ch === undefined ||
      ch === null ||
      /\s/.test(ch) ||
      ch === ',' ||
      ch === ')' ||
      ch === ']' ||
      ch === '+' ||
      ch === '-' ||
      ch === '*' ||
      ch === '=' ||
      ch === '>' ||
      ch === '<' ||
      ch === '!' ||
      ch === '|' ||
      ch === '&';

    const lookups = new Set();

    const readInstanceLensAt = (src, start) => {
      if (!src.slice(start).match(/^instance\s*\(/)) return null;

      let j = start;
      let inS = false;
      let inD = false;
      let depth = 0;

      while (j < src.length) {
        const ch = src[j];

        if (ch === "'" && !inD) {
          inS = !inS;
          j += 1;
          continue;
        }
        if (ch === '"' && !inS) {
          inD = !inD;
          j += 1;
          continue;
        }
        if (inS || inD) {
          j += 1;
          continue;
        }

        if (ch === '(') depth += 1;
        else if (ch === ')') {
          depth -= 1;
          if (depth === 0) break;
        }
        j += 1;
      }

      if (j >= src.length) return null;

      let k = j + 1;
      while (k < src.length && /\s/.test(src[k])) k += 1;
      if (src[k] !== '?') return null;

      k += 1;
      let bracketDepth = 0;
      inS = false;
      inD = false;

      while (k < src.length) {
        const ch = src[k];

        if (ch === "'" && !inD) {
          inS = !inS;
          k += 1;
          continue;
        }
        if (ch === '"' && !inS) {
          inD = !inD;
          k += 1;
          continue;
        }
        if (inS || inD) {
          k += 1;
          continue;
        }

        if (ch === '[') bracketDepth += 1;
        else if (ch === ']') {
          if (bracketDepth > 0) bracketDepth -= 1;
          else break;
        }

        if (bracketDepth === 0 && isBoundary(ch)) break;
        k += 1;
      }

      return { raw: src.slice(start, k), end: k };
    };

    const readVarLensAt = (src, start) => {
      if (src[start] !== '$') return null;

      let j = start + 1;
      if (!/[A-Za-z_]/.test(src[j] || '')) return null;
      j += 1;
      while (j < src.length && /[\w.-]/.test(src[j])) j += 1;

      const varName = src.slice(start + 1, j);

      let k = j;
      while (k < src.length && /\s/.test(src[k])) k += 1;

      // We only care if a lookup tail follows: ?foo?bar OR /foo/bar
      const next = src[k];
      if (next !== '?' && next !== '.' && next !== '/') {
        return { raw: src.slice(start, j), end: j, varName, tail: '' };
      }

      // normalize .?foo?bar => ?foo?bar
      if (next === '.' && src[k + 1] === '?') k += 1;

      // read until boundary
      let p = k;
      let bracketDepth = 0;
      let inS = false;
      let inD = false;

      while (p < src.length) {
        const ch = src[p];

        if (ch === "'" && !inD) {
          inS = !inS;
          p += 1;
          continue;
        }
        if (ch === '"' && !inS) {
          inD = !inD;
          p += 1;
          continue;
        }
        if (inS || inD) {
          p += 1;
          continue;
        }

        if (ch === '[') bracketDepth += 1;
        else if (ch === ']') {
          if (bracketDepth > 0) bracketDepth -= 1;
          else break;
        }

        if (bracketDepth === 0 && p !== k && isBoundary(ch)) break;
        p += 1;
      }

      return {
        raw: src.slice(start, p),
        end: p,
        varName,
        tail: src.slice(k, p),
      };
    };

    // Collect lookups used inside predicates
    for (const predicate of predicates) {
      const src = String(predicate ?? '');
      let inSingle = false;
      let inDouble = false;

      for (let i = 0; i < src.length; i += 1) {
        const ch = src[i];

        if (ch === "'" && !inDouble) {
          inSingle = !inSingle;
          continue;
        }
        if (ch === '"' && !inSingle) {
          inDouble = !inDouble;
          continue;
        }
        if (inSingle || inDouble) continue;

        // instance('x')?foo?bar
        const instLens = readInstanceLensAt(src, i);
        if (instLens && instLens.raw && instLens.raw.includes('?')) {
          lookups.add(instLens.raw.trim());
          i = instLens.end - 1;
          continue;
        }

        // $default?ui?query or $foo?bar  (rewrite to instance() / instance('foo'))
        const varLens = readVarLensAt(src, i);
        if (
          varLens &&
          varLens.tail &&
          (varLens.tail.startsWith('?') || varLens.tail.startsWith('/'))
        ) {
          const v = varLens.varName;
          const { tail } = varLens;

          // $default must follow your semantics: first instance in doc order => instance()
          const rewritten =
            v === 'default'
              ? `instance()${tail.startsWith('?') ? tail : tail}`
              : `instance('${v}')${tail}`;

          lookups.add(rewritten.trim());
          i = varLens.end - 1;
        }
      }
    }

    if (lookups.size === 0) return;

    // Resolve lookups to actual nodes and observe them
    for (const lookup of lookups) {
      try {
        const resolved = evaluateXPath(lookup, contextNode, this);

        let node = null;
        if (Array.isArray(resolved)) {
          const first = resolved[0];
          node = Array.isArray(first) ? first[0] : first;
        } else {
          node = resolved;
        }

        if (!node) continue;

        const mi = FxModel.lazyCreateModelItem(model, lookup, node, this);
        if (mi && typeof mi.addObserver === 'function') {
          if (!this._jsonPredicateDeps.has(mi)) {
            mi.addObserver(this);
            this._jsonPredicateDeps.add(mi);
          }
        }
      } catch (_e) {
        // ignore
      }
    }

    this._jsonPredicateDepsObserved = true;
  }

  _evalNodeset() {
    const inscope = getInScopeContext(this.getAttributeNode('ref') || this, this.ref);
    if (!inscope) return;

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

    this._observeJsonPredicateDependencies(inscope);

    if (rawNodeset.length === 1 && Array.isArray(rawNodeset[0])) {
      this.nodeset = rawNodeset[0];
      return;
    }
    this.nodeset = rawNodeset;
  }

  /**
   * Observer callback for ModelItem notifications.
   * When a predicate dependency changes (eg. $default?ui?query),
   * schedule this repeat for refresh so its nodeset/predicate is re-evaluated.
   */
  update(_modelItem) {
    const fore = this.getOwnerForm && this.getOwnerForm();
    if (fore && typeof fore.addToBatchedNotifications === 'function') {
      fore.addToBatchedNotifications(this);
      return;
    }
    // Fallback (should rarely happen)
    this.refresh(true);
  }

  async refresh(force) {
    if (!this.inited) this.init();

    const prevNodeset = this.nodeset;

    this._evalNodeset();
    this._sizeLimit = this._getSizeLimit();

    // Captured BEFORE any forcing/reclamping below, so it reflects what the DOM is
    // currently windowed to - used afterward to detect the rare case where the floor
    // itself needs to move (virtual toggled off, or the tail shrank out from under it).
    const oldWindowStart = this._windowStart;
    this._virtual = this._isVirtual();
    if (!this._virtual) this._windowStart = 0;

    let repeatItems = this.querySelectorAll(':scope > fx-repeatitem');
    let repeatItemCount = repeatItems.length;

    let nodeCount = 1;
    if (Array.isArray(this.nodeset)) {
      nodeCount = this.nodeset.length;
    }

    const total = nodeCount;
    const prevTotal = Array.isArray(prevNodeset) ? prevNodeset.length : 1;

    // Recompute the render target:
    //  - uncapped: always track the full nodeset (identical to the pre-cap `contextSize`)
    //  - capped, non-virtual, nodeset grew since the last refresh cycle: this only happens
    //    through a path that didn't already update _renderTarget itself (e.g. bulk/direct
    //    instance mutation rather than an insert/append action) - re-arm the cap by raising
    //    the floor. Growth already tracked by insert handlers or setIndex growth-on-demand
    //    does NOT hit this branch: by the time refresh() runs again after those, this.nodeset
    //    was already updated by them (they call _evalNodeset() themselves), so it hasn't
    //    grown further within *this* cycle, and _renderTarget is left exactly as they
    //    already set it.
    //  - capped, non-virtual, nodeset did not grow (shrank or same size): never grow the
    //    window here, only clamp it down if it now exceeds a (possibly smaller) total.
    //  - capped, virtual: reclamp BOTH edges to the current total, preserving window size
    //    where possible and sliding the floor back only if the tail shrank out from under
    //    it. Does not auto-follow nodeset growth mid-window - matches the non-virtual
    //    branch's "don't jump the user around" philosophy.
    if (this._sizeLimit === Infinity) {
      this._renderTarget = total;
      this._windowStart = 0;
    } else if (!this._virtual) {
      if (total > prevTotal) {
        this._renderTarget = Math.min(Math.max(this._renderTarget, this._sizeLimit), total);
      } else {
        this._renderTarget = Math.min(this._renderTarget, total);
      }
    } else {
      const newStart = Math.max(
        0,
        Math.min(this._windowStart, Math.max(0, total - this._sizeLimit)),
      );
      this._windowStart = newStart;
      this._renderTarget = Math.min(total, newStart + this._sizeLimit);
    }

    if (this._windowStart !== oldWindowStart) {
      // Rare: the window floor itself moved (virtual just turned off, or the reclamp above
      // slid it back because the nodeset's tail shrank out from under the previous window).
      // The tail-only shrink/grow loops below assume a stable floor and can't bridge a
      // floor change, so rebuild the window fresh here instead of patching a partial diff.
      repeatItems.forEach(item => {
        item.parentNode.removeChild(item);
        this.getOwnerForm().unRegisterLazyElement(item);
      });
      repeatItemCount = 0;
    }

    const goal = this._renderTarget - this._windowStart;

    if (goal < repeatItemCount) {
      for (let position = repeatItemCount; position > goal; position -= 1) {
        const itemToRemove = repeatItems[position - 1];
        itemToRemove.parentNode.removeChild(itemToRemove);
        this.getOwnerForm().unRegisterLazyElement(itemToRemove);
      }
    }

    // DOM changed: re-query repeatitems
    repeatItems = this.querySelectorAll(':scope > fx-repeatitem');
    repeatItemCount = repeatItems.length;

    if (goal > repeatItemCount) {
      for (let position = repeatItemCount + 1; position <= goal; position += 1) {
        // `position` is 1-based WITHIN the window; _materializeRepeatItem takes a 1-based
        // LOGICAL position, so offset by _windowStart (always 0 off virtual mode).
        const newItem = this._materializeRepeatItem(this._windowStart + position);

        if (this.getOwnerForm().createNodes) {
          this.getOwnerForm().initData(newItem);
        }

        this.getOwnerForm().scanForNewTemplateExpressionsNextRefresh();

        newItem.refresh(true);
      }
    }

    // DOM changed: re-query repeatitems
    repeatItems = this.querySelectorAll(':scope > fx-repeatitem');
    repeatItemCount = repeatItems.length;

    for (let position = 0; position < repeatItemCount; position += 1) {
      const item = repeatItems[position];
      const logicalIdx = this._windowStart + position;
      this.getOwnerForm().registerLazyElement(item);

      if (item.nodeset !== this.nodeset[logicalIdx]) {
        item.nodeset = this.nodeset[logicalIdx];
        if (this.getOwnerForm().createNodes) {
          this.getOwnerForm().initData(item);
        }
      }
      item.index = logicalIdx + 1;
    }

    this._syncSentinels();

    const fore = this.getOwnerForm();
    if (!fore.lazyRefresh || force) {
      await Fore.refreshChildren(this, force);
    }

    // Notify index() dependents only when THIS refresh changed the current item,
    // i.e. re-evaluating the nodeset put a different node at the current index.
    // Index changes made elsewhere (repeatitem click/focus, programmatic setIndex)
    // dispatch their own 'item-changed' — comparing against them here would
    // re-announce them, firing a spurious duplicate on every repeat refresh that
    // overlaps a click (e.g. one triggered by the structural-change consumer).
    const nodeAt = ns => (Array.isArray(ns) ? ns[this.index - 1] : ns);
    this.setIndex(this.index, nodeAt(prevNodeset) !== nodeAt(this.nodeset));
  }

  _initTemplate() {
    // Template can be missing during early init (slot timing / nested repeats).
    // Never dereference it before we have it.
    if (!this.template) {
      // Prefer a direct child template, then any descendant template.
      this.template =
        Array.from(this.children).find(c => c && c.localName === 'template') ||
        this.querySelector('template') ||
        (this.shadowRoot && this.shadowRoot.querySelector('template')) ||
        null;
    }

    if (this.template === null) {
      this.dispatchEvent(
        new CustomEvent('no-template-error', {
          composed: true,
          bubbles: true,
          detail: { message: `no template found for repeat:${this.id}` },
        }),
      );
      return;
    }

    this.dropTarget = this.template.getAttribute('drop-target');
    this.isDraggable = this.template.hasAttribute('draggable')
      ? this.template.getAttribute('draggable')
      : null;
    // Opt-in real-parentage drag/drop scoping (see withDraggability.js#_sameDropScope) -
    // default (unset) keeps today's id-string-equality scoping unchanged. Reflected onto
    // this element too (not just repeat-items) since <fx-repeat> itself is a valid drop
    // target (appending) and _sameDropScope reads the attribute directly.
    this.dropScope = this.template.getAttribute('drop-scope');
    if (this.dropScope) {
      this.setAttribute('drop-scope', this.dropScope);
    }

    // Move template to shadow for safe reuse.
    // If it's already in the shadowRoot, don't append again.
    if (this.template.parentNode !== this.shadowRoot) {
      this.shadowRoot.appendChild(this.template);
    }
  }

  _initRepeatItems() {
    this._sizeLimit = this._getSizeLimit();
    this._virtual = this._isVirtual();
    this._windowStart = 0; // initial render always starts the window at the beginning
    const total = this.nodeset.length;
    this._renderTarget = Math.min(total, this._sizeLimit);

    for (let position = 1; position <= this._renderTarget; position += 1) {
      const repeatItem = this._materializeRepeatItem(position);

      if (this.getOwnerForm().createNodes) {
        this.getOwnerForm().initData(repeatItem);

        // `createdNodeset` is only ever read once, as an insert template for a *new* row
        // (see fx-insert.js), so it's taken from the LAST MATERIALIZED row - cloning and
        // clearing every earlier row's nodeset was pure waste (O(n) discarded work, e.g.
        // 799 of 800 clones for the UNTDID 1001 codelist). It must be snapshotted AFTER
        // initData() above, which is what actually populates create-nodes-synthesized
        // descendants (e.g. TaxCategory/ID, TaxCategory/Percent) onto the node - cloning
        // before that yields an empty shell. Under a size cap this may not be the true
        // last logical nodeset entry, but it's the best representative shape available
        // (the true last entry may never be materialized).
        if (position === this._renderTarget && repeatItem.nodeset.nodeType) {
          const repeatItemClone = repeatItem.nodeset.cloneNode(true);
          this.clearTextValues(repeatItemClone);
          this.createdNodeset = repeatItemClone;
        }
      }

      if (repeatItem.index === 1) {
        this.applyIndex(repeatItem);
      }

      Fore.dispatch(this, 'item-created', { nodeset: repeatItem.nodeset, pos: position });
    }

    this._syncSentinels();
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
    // Names already present here came from an ancestor scope (this.inScopeVariables), not
    // from an element in newRepeatItem's own subtree - fx-var.setInScopeVariables() uses
    // this to tell "shadowing an inherited name" (allowed, e.g. a recursive template
    // re-declaring the same <fx-var name="..."> once per depth) apart from "declared twice
    // at the same level" (a real authoring error, still rejected).
    inScopeVariables.__inheritedNames = new Set(inScopeVariables.keys());
    newRepeatItem.setInScopeVariables(inScopeVariables);
    (function registerVariables(node) {
      for (const child of node.children) {
        if ('setInScopeVariables' in child) {
          child.setInScopeVariables(inScopeVariables);
        }
        // A nested <fx-repeat> (statically authored, or synthesized by <fx-repeat-ref>
        // for recursion) owns registering variable scope for its own items once it
        // materializes them - by the time this walk runs it may already have done so
        // (custom-element upgrades, and so <fx-repeat-ref>'s synchronous synthesis, fire
        // during the insertBefore() that precedes this call). Recursing into it here
        // would re-register names its own descendants already hold, retargeting them to
        // this (unrelated) map instead.
        if (child.tagName === 'FX-REPEAT') continue;
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
