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
				type: Boolean
			}
		};
	}

	constructor() {
		super();

		this.dragstart = null;
		this.dragover = null;
		this.dragleave = null;
		this.dragend = null;
		this.drop = null;
    }

	connectedCallback() {
        this.drop = this.addEventListener('drop', event => this._drop(event));
        this.dragOver = this.addEventListener('dragover', event => this._dragOver(event));
        this.dragleave = this.addEventListener('dragleave', event => this._dragLeave(event));
        this.dragend = this.addEventListener('dragend', event => this._dragEnd(event));

        if (this.hasAttribute('draggable')) {
			this.initDragAndDrop();
		}
	}

	initDragAndDrop() {
		if (isAlsoDraggable) {
            this.dragstart = this.addEventListener('dragstart', event => this._dragStart(event));
		}
	}

	disconnectedCallback() {
		if (this.drop) {
            this.removeEventListener('drop', this.drop);
		}
		if (this.dragover) {
            this.removeEventListener('dragover', this.dragover);
		}
		if (this.dragleave) {
            this.removeEventListener('dragleave', this.dragleave);
		}
		if (this.dragend) {
            this.removeEventListener('dragend', this.dragend);
		}
		if (this.dragstart) {
            this.removeEventListener('dragstart', this.dragstart);
		}
	}

	/*
	 * TODO: unneeded?
	 */
	_dragStart(event) {
		event.dataTransfer.dropEffect = 'move';

		this.getOwnerForm().draggedItem = this;

		event.stopPropagation();
	}

    _dragOver(event) {
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
		const draggedItem = this.getOwnerForm().draggedItem;
		const thisClosestRepeat = this.hasAttribute('id') ? this : this.closest('[id]');
		const draggingClosestRepeat = draggedItem.hasAttribute('id') ? draggedItem : draggedItem.closest('[id]');
		if (thisClosestRepeat?.id === draggingClosestRepeat?.id) {
			if (repeatItem !== this.getOwnerForm().draggedItem) {
				this.classList.add('drag-over');
			}

			event.preventDefault();
		}
    }

    _dragLeave(event){
		this.classList.remove('drag-over');
    }

	_dragEnd (event) {
		this.getOwnerForm().draggedItem = null;
        this.classList.remove('drag-over');
		event.stopPropagation();
	}

	_getDataNode () {
		const dataNode = this.getOwnerForm().draggedItem?.getModelItem()?.node;
		if (!dataNode) {
			return null;
		}

		const draggedItem = this.getOwnerForm().draggedItem;
		const thisClosestRepeat = this.hasAttribute('id') ? this : this.closest('[id]');
		const draggingClosestRepeat = draggedItem.hasAttribute('id') ? draggedItem : draggedItem.closest('[id]');
		if (thisClosestRepeat?.id !== draggingClosestRepeat?.id) {
			// Moving between different repeats: this can make the items 'lost': placed into a
			// different set
			return null;
		}

		return dataNode;
	}

    _drop(event){
        this.classList.remove('drag-over');
        event.stopPropagation();
		if (this.localName === 'fx-droptarget') {
			this.replaceChildren(this.getOwnerForm().draggedItem);
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
