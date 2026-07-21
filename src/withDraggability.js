import getInScopeContext from './getInScopeContext.js';

/**
 * Resolves the real data-parent node of a drag/drop participant, for
 * `drop-scope="parent"` comparisons (see `_sameDropScope` below).
 *
 * XML nodes expose `.parentNode`; JSON-lens nodes (`JSONNode`, see
 * `src/json/JSONNode.js`) expose `.parent` instead and are flagged with
 * `.__jsonlens__ === true` - both must be handled since repeats bind to
 * either instance type equally.
 *
 * @param {HTMLElement} el
 * @returns {Node|null}
 */
function _resolveScopeParent(el) {
  if (el.localName === 'fx-repeatitem') {
    const node = el.getModelItem ? el.getModelItem()?.node : null;
    if (!node) return null;
    return node.__jsonlens__ ? node.parent : node.parentNode;
  }
  if (el.localName === 'fx-repeat') {
    return getInScopeContext(el.getAttributeNode('ref') || el, el.ref);
  }
  return null;
}

/**
 * @template {typeof import('./ForeElementMixin.js').default} T
 * @param {T} superclass
 * @returns {T}
 */
export const withDraggability = (superclass, isAlsoDraggable) =>
  /**
   * Adds draggability to generic components.
   * Add the `dnd` attribute to make it draggable
   */
  class DraggableComponent extends superclass {
    static get properties() {
      return {
        ...superclass.properties,
        dnd: {
          type: Boolean,
        },
      };
    }

    connectedCallback() {
      super.connectedCallback();

      this.drop = event => this._drop(event);
      this.addEventListener('drop', this.drop);
      this.dragOver = event => this._dragOver(event);
      this.addEventListener('dragover', this.dragOver);
      this.dragLeave = event => this._dragLeave(event);
      this.addEventListener('dragleave', this.dragLeave);
      this.dragEnd = event => this._dragEnd(event);
      this.addEventListener('dragend', this._dragEnd);
    }

    disconnectedCallback() {
      this.removeEventListener('drop', this.drop);
      this.removeEventListener('dragover', this.dragOver);
      this.removeEventListener('dragleave', this.dragLeave);
      this.removeEventListener('dragend', this.dragEnd);
    }

    _dragOver(event) {
      //		console.log('dragover ',this);
      //		console.log('event target ',event.target);
      if (event.target.classList.contains('no-drop')) {
        return false;
      }
      event.stopPropagation();
      const repeatItem = event.target.closest('fx-repeatitem');
      if (!this.getOwnerForm().draggedItem) {
        // Not dragging
        return;
      }
      // Only allow drag and drop in similar repeats
      if (this === this.getOwnerForm().draggedItem) {
        // Ignore: drop on itself
        return;
      }
      const { draggedItem } = this.getOwnerForm();

      // `accept` is an opt-in allowlist (like the native <input accept>): no `accept`
      // attribute at all means no restriction, not "reject everything" - accepts()
      // returns undefined (not true) when there's nothing to check, which is not the
      // same as an actual rejection.
      if (!this.hasAttribute('accept') || this.accepts(draggedItem)) {
        this.classList.remove('no-drop');
      } else {
        this.classList.add('no-drop');
      }

      if (this._sameDropScope(draggedItem)) {
        if (repeatItem !== this.getOwnerForm().draggedItem) {
          this.classList.add('drag-over');
          // A drop on an fx-repeatitem always means "insert as a sibling" - which side
          // depends on which half of the target the pointer is over, matching the
          // "line between items" convention of most reorderable-list UIs (see
          // drop-before/drop-after handling in fore.css and _drop() below).
          if (this.localName === 'fx-repeatitem') {
            const rect = this.getBoundingClientRect();
            const isAfter = event.clientY > rect.top + rect.height / 2;
            this.classList.toggle('drop-after', isAfter);
            this.classList.toggle('drop-before', !isAfter);
          }
        }

        event.preventDefault();
      }
    }

    /**
     * Is `other` in the same drag/drop scope as `this`?
     *
     * Default (no `drop-scope` attribute on either side): today's behavior -
     * id-string equality of the nearest ancestor-with-an-`id`. Statically/
     * recursively nested repeats at the same generation necessarily share one
     * literal `id`, so this treats every generation-N instance as "the same
     * repeat" - intentionally relied on by e.g. `demo/kanban.html` to let
     * cards be dragged between different columns.
     *
     * Opt-in (`drop-scope="parent"` on the `<template>`, propagated onto the
     * repeat and its items - see `fx-repeat.js#_initTemplate`/`_createNewRepeatItem`):
     * compares real data parentage instead, so structurally identical sibling
     * containers at the same depth are correctly treated as different scopes.
     */
    _sameDropScope(other) {
      if (
        this.getAttribute('drop-scope') === 'parent' ||
        other.getAttribute('drop-scope') === 'parent'
      ) {
        const thisParent = _resolveScopeParent(this);
        const otherParent = _resolveScopeParent(other);
        return !!thisParent && !!otherParent && thisParent === otherParent;
      }
      const thisClosestRepeat = this.hasAttribute('id') ? this : this.closest('[id]');
      const otherClosestRepeat = other.hasAttribute('id') ? other : other.closest('[id]');
      return thisClosestRepeat?.id === otherClosestRepeat?.id;
    }

    _dragLeave(event) {
      this.classList.remove('drag-over', 'no-drop', 'drop-before', 'drop-after');
    }

    _dragEnd(event) {
      // 'dragend' always fires on the original drag source (this), regardless of
      // copy/move mode - unlike getOwnerForm().draggedItem, which points at a detached
      // clone in copy mode. Always clear the fade, even if a 'drop' already nulled out
      // draggedItem before 'dragend' fires (the early return below would otherwise skip it).
      this.classList.remove('dragging');
      const item = this.getOwnerForm().draggedItem;
      if (!item) return;
      if (item.getAttribute('drop-action') === 'copy') {
        item.remove();
      }
      this.classList.remove('drag-over', 'drop-before', 'drop-after');
      //		event.stopPropagation();
    }

    _getDataNode() {
      const dataNode = this.getOwnerForm().draggedItem?.getModelItem()?.node;
      if (!dataNode) {
        return null;
      }

      const { draggedItem } = this.getOwnerForm();
      if (!this._sameDropScope(draggedItem)) {
        // Moving between different repeats: this can make the items 'lost': placed into a
        // different set
        return null;
      }

      return dataNode;
    }

    accepts(draggedItem) {
      if (!this.hasAttribute('accept')) {
        return;
      }
      const accept = this.getAttribute('accept');
      const isAccepted = draggedItem.matches(accept);
      // console.log('accepted', isAccepted);
      return isAccepted;
    }

    _drop(event) {
      // Capture before clearing: which half of the target (see _dragOver) the drop
      // landed on decides whether the dragged item is inserted before or after it.
      const dropAfter = this.classList.contains('drop-after');
      this.classList.remove('drag-over', 'drop-before', 'drop-after');
      event.stopPropagation();
      if (this.localName === 'fx-droptarget') {
        if (this.children.length !== 0) {
          console.log('we have to do something');
        }

        let { draggedItem } = this.getOwnerForm();

        if (draggedItem.getAttribute('drop-action') === 'copy') {
          draggedItem = draggedItem.cloneNode(true);
        }

        if (!this.accepts(draggedItem)) {
          this.classList.remove('no-drop');
          return;
        }
        if (draggedItem === this) {
          return;
        }
        if (draggedItem.localName === 'fx-droptarget') {
          // todo : this looks still a bit weak
          if (this.hasAttribute('drop-position')) {
            this.replaceChildren(draggedItem);
            event.preventDefault();
            return;
          }
          if (this.parentNode.lastElementChild === this) {
            this.parentNode.append(draggedItem);
            event.stopImmediatePropagation();
            // return;
          } else if (draggedItem === this.previousElementSibling) {
            // insertBefore of draggedItem before us would be a no-op: it is already before us.
            // Instead: insert _after_ us, so we can still do something!
            this.parentNode.insertBefore(draggedItem, this.nextElementSibling);
          } else {
            this.parentNode.insertBefore(draggedItem, this);
          }
        } else {
          this.appendChild(draggedItem);
        }

        /*
			if(this.hasAttribute('drop-position')){
				if(this.getAttribute('drop-position') === 'before'){
					this.parentNode.insertBefore(draggedItem,this);
				} else {
					this.parentNode.append(draggedItem);
				}
			}else{
				this.replaceChildren(draggedItem);
			}
*/
        // NOTE: this branch (fx-droptarget) reorders live DOM/UI elements directly, not
        // instance data - there is nothing here for UndoManager's instance-data snapshots
        // to capture, so it is intentionally not wrapped with undo capture (see the
        // dataNode branch below for the case that IS undoable).
        event.preventDefault();
        this.getOwnerForm().getModel().updateModel();
        this.getOwnerForm().refresh(true);
        return;
      }
      const dataNode = this._getDataNode();
      if (!dataNode) {
        return;
      }

      const model = this.getOwnerForm().getModel();
      const undoManager = model.getEffectiveUndoManager();
      undoManager.beginCapture();

      if (this.localName === 'fx-repeat') {
        // We are sure we'll handle this event!
        event.preventDefault();
        // Dropping on repeat itself always means to *append* the dropped item

        let contextNode = this.nodeset;
        if (Array.isArray(contextNode) && !contextNode.length) {
          // Guess: just append it to the context node. Hope that the `ref` is actually a
          // child axis, like `ref="./item"`. A ref like `./items/item` breaks.
          const context = getInScopeContext(this.getAttributeNode('ref') || this, this.ref);
          context.append(dataNode);
        } else {
          // Guess: just insert it after it to the context node. Hope that the `ref` is
          // actually listing siblings, like `ref="./item"` or
          // `ref="./items/item"`. `ref="descendant::item[@category='a']"` breaks
          contextNode = contextNode[contextNode.length - 1];
          contextNode.after(dataNode);
        }
      } else if (this.localName === 'fx-repeatitem') {
        const repeatItemNode = this.getModelItem().node;

        if (dropAfter) {
          repeatItemNode.after(dataNode);
        } else {
          repeatItemNode.before(dataNode);
        }
      }

      // Note: full refresh needed since multiple model items may be affected.
      model.updateModel();
      this.getOwnerForm().refresh(true);
      undoManager.commit(dataNode);
    }
  };
