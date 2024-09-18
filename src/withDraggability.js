import getInScopeContext from './getInScopeContext.js';

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

    constructor() {
      super();
    }

    connectedCallback() {
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

      if (this.accepts(draggedItem)) {
        this.classList.remove('no-drop');
      } else {
        this.classList.add('no-drop');
      }

      const thisClosestRepeat = this.hasAttribute('id') ? this : this.closest('[id]');
      const draggingClosestRepeat = draggedItem.hasAttribute('id')
        ? draggedItem
        : draggedItem.closest('[id]');
      if (thisClosestRepeat?.id === draggingClosestRepeat?.id) {
        if (repeatItem !== this.getOwnerForm().draggedItem) {
          this.classList.add('drag-over');
        }

        event.preventDefault();
      }
    }

    _dragLeave(event) {
      this.classList.remove('drag-over');
      this.classList.remove('no-drop');
    }

    _dragEnd(event) {
      const item = this.getOwnerForm().draggedItem;
      if (item.getAttribute('drop-action') === 'copy') {
        item.remove();
      }
      this.classList.remove('drag-over');
      //		event.stopPropagation();
    }

    _getDataNode() {
      const dataNode = this.getOwnerForm().draggedItem?.getModelItem()?.node;
      if (!dataNode) {
        return null;
      }

      const { draggedItem } = this.getOwnerForm();
      const thisClosestRepeat = this.hasAttribute('id') ? this : this.closest('[id]');
      const draggingClosestRepeat = draggedItem.hasAttribute('id')
        ? draggedItem
        : draggedItem.closest('[id]');
      if (thisClosestRepeat?.id !== draggingClosestRepeat?.id) {
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
      this.classList.remove('drag-over');
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
        event.preventDefault();
        this.getOwnerForm().getModel().updateModel();
        this.getOwnerForm().refresh(true);
        return;
      }
      const dataNode = this._getDataNode();
      if (!dataNode) {
        return;
      }

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

        if (repeatItemNode.previousSibling === dataNode) {
          // moving before will make it do nothing, move after
          repeatItemNode.after(dataNode);
        } else {
          repeatItemNode.before(dataNode);
        }
      }

      // Note: full refresh needed since multiple model items may be affected.
      // TODO: Leverage the changedPaths trick
      this.getOwnerForm().getModel().updateModel();
      this.getOwnerForm().refresh(true);
    }
  };
