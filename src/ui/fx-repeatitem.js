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
    this.dragstart=null;
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

    this.getOwnerForm().addEventListener('ready', (e) => {
      console.log('repeatitem getting ready from parent Fore', this)

      if(this.parentNode.hasAttribute('dnd')){
        this.dragstart = this.addEventListener('dragstart', e => this._startDragging(e));
        this.dragOver = this.addEventListener('dragover', e => this._dragOver(e));
        this.dragLeave = this.addEventListener('dragleave', e => this._dragLeave(e));
        this.drop = this.addEventListener('drop', e => this._drop(e));
        this.parentNode.draggedItem = this;
      }
    });
  }

  get draggedItem(){
    return FxFore.draggedItem;
  }

  set draggedItem(item) {
    FxFore.draggedItem = item;
  }

  _startDragging(event) {
    console.log('_startDragging from repeatitem', event);
    // event.preventDefault();
    // this.focus();

    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.setData('text/html', this.outerHTML);
    this.draggedItem = event.target; // store in repeat parent
    console.log('drag start', this)
    // event.preventDefault();
    const myNode = this.getModelItem().node;
    myNode.parentNode.removeChild(myNode);
  }
  _dragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    // console.log('dragover',event);
    // console.log('dragover repeatItem',this);

    const repeatItem = event.target.closest('fx-repeatitem');
    if (repeatItem !== this.draggedItem) {
      this.classList.add('drag-over');
    }
  }

  _dragLeave(event){
    // console.log('_dragLeave',event);
    this.classList.remove('drag-over');
  }

  _drop(event){
    console.log('drop',event);
    event.target.closest('fx-repeatitem').classList.remove('drag-over');
    event.preventDefault();
    event.stopPropagation();
    // const droppedElement = event.dataTransfer.getData('text/html');
    // console.log('dropped element', droppedElement);

    const dataNode = this.draggedItem.getModelItem().node;
    const parent = dataNode.parentNode;
    console.log('ModelItem',dataNode);

    if(event.target.nodeName === 'FX-REPEAT'){
      console.log('drop onto repeat',event.target);

      parent.removeChild(dataNode);
      const targetRepeat = event.target;
      const targetNodeset = targetRepeat.getModelItem().node;


      if(Array.isArray(targetNodeset)){
        if(targetNodeset.length === 0){
          parent.append(dataNode);
        }else{
          // todo: still a bug around here
          // targetNodeset[0].parentNode.append(dataNode);// re-append
          parent.append(dataNode);
        }
      }else{
        targetNodeset.parentNode.append(dataNode);// re-append
      }

      document.querySelector('fx-fore').dispatchEvent(
          new CustomEvent('refresh', {
            composed: false,
            bubbles: true,
            detail:{force:true},
          }));

      return;

    }
    const repeatItem = event.target.closest('fx-repeatitem');
    console.log('drop onto item',repeatItem);


    if(event.target.nodeName !== 'FX-REPEATITEM'){
      const parentItem = event.target.closest('fx-repeatitem');

    }

    /*
                    if(!repeatItem.parentNode.contains(draggedItem)){
                        return;
                    }
    */

    if(!repeatItem){
      this.draggedItem.append(this.draggedItem);
    }

    if(repeatItem !== this.draggedItem){
      const itemHeight = repeatItem.offsetHeight;

      console.log('itemHeight', itemHeight)
      console.log('offsetY', event.offsetY)
      if(event.offsetY > itemHeight / 2 ){
        console.log('drop after data',repeatItem.getModelItem().node);
        const repeatItemNode = repeatItem.getModelItem().node;

        // repeatItem.after(draggedItem);
        // dataNode.parentNode.removeChild(dataNode);
        repeatItemNode.after(dataNode.cloneNode(true));


      }else{
        console.log('drop before data',repeatItem.getModelItem().node);
        const repeatItemNode = repeatItem.getModelItem().node;
        // draggedItem.parentNode.insertBefore(draggedItem,repeatItem);

        repeatItemNode.before(dataNode.cloneNode(true));
        parent.removeChild(dataNode);

        console.log('data',dataNode.ownerDocument)

      }
      //
      document.querySelector('fx-fore').dispatchEvent(
          new CustomEvent('refresh', {
            composed: false,
            bubbles: true,
            detail:{force:true},
          }));
    }

    // e.target.innerHTML=droppedElement;


  }

  disconnectedCallback() {
    // console.log('disconnectedCallback ', this);
    this.removeEventListener('click', this._dispatchIndexChange());
    this.removeEventListener('focusin', this._handleFocus);
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
