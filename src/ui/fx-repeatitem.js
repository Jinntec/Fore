import { Fore } from '../fore.js';
import { foreElementMixin } from '../ForeElementMixin.js';
import {FxFore} from "../fx-fore.js";

/**
 * `fx-repeat`
 * an xformish form for eXist-db
 *
 * @customElement
 * @demo demo/index.html
 */
export class FxRepeatitem extends foreElementMixin(HTMLElement) {
  static get properties() {
    return {
      inited: {
        type: Boolean,
      },
    };
  }

  constructor() {
    super();
    this.inited = false;

    this.addEventListener('click', this._dispatchIndexChange);
    // this.addEventListener('focusin', this._handleFocus);
    this.addEventListener('focusin', this._dispatchIndexChange);

    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.dragStart=null;
    this.dragover=null;
    this.dragleave=null;
    this.drop=null;
  }

  _handleFocus() {
    this.parentNode.setIndex(this.index);
    // TODO: do this somewhere else, somewhere more central

    /**
     * todo: resolve - this is problematic as it triggers a lot of unneeded refreshes but it needed
     * when you want to support activating the right repeatitem when the user tabs through controls.
     */
    // this.closest('fx-fore').refresh();
  }

  _dispatchIndexChange() {
    // console.log('_dispatchIndexChange on index ', this.index);
    if (this.parentNode) {
      this.parentNode.dispatchEvent(
        new CustomEvent('item-changed', { composed: false, bubbles: true, detail: { item: this , index:this.index } }),
      );
    }
  }

  connectedCallback() {
    this.display = this.style.display;

    const html = `
           <slot></slot>
        `;

    this.shadowRoot.innerHTML = `
            ${html}
        `;
    this.getOwnerForm().registerLazyElement(this);

    this.ref = `${this.parentNode.ref}`;

    this.tabindex=0;

	if (this.parentNode.hasAttribute('dnd')) {
        this.dragStart = this.addEventListener('dragstart', e => this._startDragging(e));
        this.dragOver = this.addEventListener('dragover', e => this._dragOver(e));
        this.dragLeave = this.addEventListener('dragleave', e => this._dragLeave(e));
        this.dragEnd = this.addEventListener('dragend', e => this._dragEnd(e));
        this.drop = this.addEventListener('drop', e => this._drop(e));
      }
  }

	disconnectedCallback() {
		this.removeEventListener('click', this._dispatchIndexChange());
		this.removeEventListener('focusin', this._handleFocus);

		this.removeEventListener('dragover', this.dragStart);
		this.removeEventListener('dragstart', this.dragOver);
		this.removeEventListener('dragleave', this.dragLeave);
		this.removeEventListener('drop', this.drop);
	}

  _startDragging(event) {
    console.log('_startDragging from repeatitem', event);
    // event.preventDefault();
    // this.focus();

    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.setData('text/html', this.outerHTML);
      console.log('drag start', this);

	  this.getOwnerForm().draggedItem = this.getModelItem().node;
    // event.preventDefault();
  }

  _dragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    // console.log('dragover',event);
    // console.log('dragover repeatItem',this);

    const repeatItem = event.target.closest('fx-repeatitem');
    if (repeatItem !== this) {
      this.classList.add('drag-over');
    }
  }

  _dragLeave(event){
    // console.log('_dragLeave',event);
    this.classList.remove('drag-over');
  }

	_dragEnd (event) {
		console.log('dragEnd',event);

		this.getOwnerForm().draggedItem = null;
		// const dataNode = this.getModelItem().node;
		// const parent = dataNode.parentNode;
		// if (parent) {
		// 	parent.removeChild(dataNode);
		// }
//		this.getOwnerForm().refresh(true);
	}

	_drop(event){
		console.log('drop onto item',event);
		const dataNode = this.getOwnerForm().draggedItem;
		if (!dataNode) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();

		console.log('ModelItem',dataNode);

      const itemHeight = this.offsetHeight;

      if(event.offsetY > itemHeight / 2 ){
        console.log('drop after data',this.getModelItem().node);
        const repeatItemNode = this.getModelItem().node;

        // repeatItem.after(draggedItem);
        // dataNode.parentNode.removeChild(dataNode);
        repeatItemNode.after(dataNode);
      } else {
        console.log('drop before data',this.getModelItem().node);
        const repeatItemNode = this.getModelItem().node;
        // draggedItem.parentNode.insertBefore(draggedItem,repeatItem);

        repeatItemNode.before(dataNode);
          console.log('data',dataNode.ownerDocument);
      }
	  // Note: full refresh needed since multiple model items may be affected.
	  // TODO: Leverage the changedPaths trick
      this.getOwnerForm().refresh(true);
  }


  init() {
    // console.log('repeatitem init model ', this.nodeset);
    // this._initializeChildren(this);
    this.inited = true;
  }

  /*
  getModelItem() {
    super.getModelItem();
    // console.log('modelItem in repeatitem ', this.getModelItem()[this.index]);
    return this.getModelItem()[this.index];
  }
*/

  refresh(force) {
    this.modelItem = this.getModelItem();
    // ### register ourselves as boundControl
    if (!this.modelItem.boundControls.includes(this)) {
      this.modelItem.boundControls.push(this);
    }

    if (this.modelItem && !this.modelItem.relevant) {
        this.setAttribute('nonrelevant','');
    } else {
		this.setAttribute('relevant','');
    }

    /*
    if (this?.modelItem?.relevant) {
      // Fore.refreshChildren(this);
    } else {
    }
*/

    Fore.refreshChildren(this, force);
  }
}

if (!customElements.get('fx-repeatitem')) {
  window.customElements.define('fx-repeatitem', FxRepeatitem);
}
