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
        if (!this.hasAttribute('dnd')) {
			return;
		}
        this.drop = this.addEventListener('drop', event => this._drop(event));
        this.dragOver = this.addEventListener('dragover', event => this._dragOver(event));
        this.dragleave = this.addEventListener('dragleave', event => this._dragLeave(event));
        this.dragleave = this.addEventListener('dragleave', event => this._dragLeave(event));
        this.dragend = this.addEventListener('dragend', event => this._dragEnd(event));
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

	_dragStart(event) {
		console.log('drag start', this);
		event.dataTransfer.dropEffect = 'move';
		event.dataTransfer.setData('text/html', this.outerHTML);

		this.getOwnerForm().draggedItem = this;

		event.stopPropagation();
	}

    _dragOver(event) {
        event.stopPropagation();
        // console.log('dragover',event);
        // console.log('dragover repeatItem',this);

        const repeatItem = event.target.closest('fx-repeatitem');
        if (repeatItem !== this.getOwnerForm().draggedItem) {
            this.classList.add('drag-over');
        }
		if (!this.getOwnerForm().draggedItem) {
			// Not dragging
			return;
		}
		// Only allow drag and drop in similar repeats
		if (this.id === this.getOwnerForm().draggedItem.id) {
			event.preventDefault();
		}
    }

    _dragLeave(event){
        // console.log('_dragLeave',event);
        this.classList.remove('drag-over');
    }

	_dragEnd (event) {
		console.log('dragEnd',event);

		this.getOwnerForm().draggedItem = null;
        this.classList.remove('drag-over');
	}

    _drop(event){
        console.log('dropped',this, this.getOwnerForm().draggedItem);
        this.classList.remove('drag-over');
        event.preventDefault();
        event.stopPropagation();
		const dataNode = this.getOwnerForm().draggedItem.getModelItem().node;
		if (!dataNode){
			return;
		}

		if (this.localName === 'fx-repeat') {
			// dropping on repeat itself always means to *append* the dropped item
			// const dataNode = this.draggedItem.getModelItem().node;

			// TODO: Make this pluggable!
			console.log('dropped on repeat - data:', dataNode);

			const targetNodeset = this.getModelItem().node;
			if(!targetNodeset) return;

			let contextNode = getInScopeContext(this, this.ref);
			if (Array.isArray(contextNode)) {
				contextNode = contextNode[contextNode.length-1];
			}
			contextNode.append(dataNode);
		}

		else if (this.localName === 'fx-repeatitem') {
			console.log('drop onto item',event);

			console.log('ModelItem',dataNode);

			const itemHeight = this.offsetHeight;

			const repeatItemNode = this.getModelItem().node;
			if(event.offsetY > itemHeight / 2 ){
				console.log('drop after data',this.getModelItem().node);

				repeatItemNode.after(dataNode);
			} else {
				console.log('drop before data',this.getModelItem().node);

				repeatItemNode.before(dataNode);
				console.log('data',dataNode.ownerDocument);
			}
		}

		// Note: full refresh needed since multiple model items may be affected.
		// TODO: Leverage the changedPaths trick

		this.getOwnerForm().refresh(true);
    }
};
