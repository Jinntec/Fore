import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import {BoundElementMixin} from './BoundElementMixin.js';
import {XfRepeatItem} from './xf-repeat-item.js';
import {XfForm} from './xf-form.js';


/**
 * `xf-repeat`
 * an xformish form for eXist-db
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
export class XfRepeat extends BoundElementMixin(PolymerElement) {
    static get template() {
        return html`
          <style>
            :host {
              display: block;
            }
          </style>
          <slot></slot>
        `;
    }

    static get properties() {
        return {
            bind: {
                type: String
            },
            template: {
                type: Object
            },
            dataTemplate: {
                type: Array,
                value: []
            },
            focusOnCreate: {
                type: String
            },
            initDone: {
                type: Boolean,
                value: false
            },
            repeatIndex:{
                type: Number,
                value:1,
                observer:'_repeatIndexChanged'
            }
        };
    }

    _repeatIndexChanged(oldVal, newVal){
        console.log('### repeatIndex changed to ', this.repeatIndex);
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('### xf-repeat connected ', this);
        console.log('### xf-repeat connected index', this.repeatIndex);

    }

    init() {
        console.log('### init ',this);
        if(this.repeated){
            const parentItem = this.parentNode.modelItem;
            this.modelItem = this.ownerForm.findById(parentItem, this.bind)
        }else{
            super.init();
        }
        this._initTemplate();
        this._initializeRepeatItems();
        this.initDone = true;
    }

    refresh() {
        const repeatItems = this.querySelectorAll('xf-repeat-item');
        for (let i = 0; i < repeatItems.length; i++) {
            const item = repeatItems[i];
            item.refresh();
        }
    }

    setCurrent(repeatItem) {
        console.log('### select repeat-item ', repeatItem, repeatItem.modelItem);
        if(repeatItem.hasAttribute('repeat-index')) return;

        const index = Array.from(this.querySelectorAll('xf-repeat-item')).indexOf(repeatItem);
        this._setIndex(repeatItem);
        this.repeatIndex = index + 1;
    }

    _setIndex(repeatItem){
        this._removeIndexMarker();
        repeatItem.setAttribute('repeat-index','');
    }

    _removeIndexMarker() {
        Array.from(this.children).forEach( item => {
            item.removeAttribute('repeat-index');
        });
    }


    _initTemplate() {
        // ### there must be a single 'template' child
        this.template = this.firstElementChild;
        console.log('### init template for repeat ', this.id , this.template);
        if (this.template === null) {
            // console.error('### no template found for this repeat:', this.id);
            //todo: catch this on form element
            this.dispatchEvent(new CustomEvent('no-template-error', {
                composed: true,
                bubbles: true,
                detail: {"message": "no template found for repeat:" + this.id}
            }));
        }
    }

    _initializeRepeatItems() {
        // ### first unroll repeat-items to instanciate the controls
        if(!this.modelItem) return;
        if(!this.modelItem.bind) return;

        const items = Array.from(this.modelItem.bind);
        let newItem;
        console.group('_initializeRepeatItems');
        this.modelItem.bind.forEach(item => {
            // console.log('_unroll binding ', item);
            const index = this.modelItem.bind.indexOf(item);
            // newItem = this._createRepeatItem(index);
            newItem = this._appendRepeatItem(index);
        });
        console.groupEnd('_initializeRepeatItems');

        const first = this.children[1]; // first repeat-item must always be second element as there's the template as first always.
        // first.setAttribute('repeat-index', '');

        this._setIndex(first);
    }


    appendRepeatItem() {
        // ### create a repeat-item in the UI

        if(!this.initDone){
            console.warn('append before repeat was initialized');
        }

        const dTmpl = this._getDataTemplate();
        console.log('### dataTemplate from repeat ', dTmpl);

        // ### update the model (adding an entry to bind array)
        // if(!this.modelItem || !this.modelItem.bind){
        if(!this.modelItem || !this.modelItem.bind){
            this.modelItem = {'id': this.bind, bind:[]};
            // this.modelItem.bind = new Array();
        }
        this.modelItem.bind.push(dTmpl);

        let index;
        if(this.modelItem){
            index = this.modelItem.bind.length - 1;
        }else{
            index = 1;
        }

        this.repeatIndex = index + 1;
        // const index = this.modelItem.bind.length - 1;
        // const item = this._createRepeatItem(index);
        const item = this._appendRepeatItem(index);
        // this.appendChild(item);

        this._setIndex(item);

        const path = this.ownerForm.resolveBinding(this);
        this.dispatchEvent(new CustomEvent('repeat-item-appended', {
            composed: true,
            bubbles: true,
            detail: {
                'bind': this.bind,
                'nodeId': this.modelItem.nodeId,
                'appendLocation': this.repeatIndex,
                'appendedItem': item.modelItem,
                "path":path
            }
        }));

    }

    insertRepeatItem(position){
        console.log('### insertRepeatItem', position);

        const dTmpl = this._getDataTemplate();
        if(!this.modelItem || !this.modelItem.bind){
            this.modelItem = {'id': this.bind, bind:[]};
        }

        if(position === 'before'){
            if(this.repeatIndex === 1){
                this.modelItem.bind.unshift(dTmpl);
                this.repeatIndex = 1;
            }else{
                this.modelItem.bind.splice(this.repeatIndex-1,0,dTmpl);
                // this.repeatIndex -= 1;
            }
        }else{
            this.modelItem.bind.splice(this.repeatIndex,0,dTmpl);
            // this.repeatIndex += 1;
        }

        const item = this._insertRepeatItem(position);
        this._setIndex(item);

        const path = this.ownerForm.resolveBinding(this);
        this.dispatchEvent(new CustomEvent('repeat-item-inserted', {
            composed: true,
            bubbles: true,
            detail: {
                'bind': this.bind,
                'insertLocation': this.repeatIndex,
                'insertedItem': item.modelItem,
                "path":path
            }
        }));

    }

    _appendRepeatItem(index){
        const repeatItem = this._createElement();

        this.appendChild(repeatItem);

        // ###  and initialize it
        // repeatItem.index = index;
        repeatItem.modelItem = this.modelItem.bind[index];
        repeatItem.addEventListener('repeat-item-created', this._handleItemCreated.bind(this));
        repeatItem.init();
        return repeatItem;
    }

    _insertRepeatItem(position) {

        // determine reference item
        const referenceNode = this.querySelectorAll('xf-repeat-item')[this.repeatIndex-1];

        // ### create a repeat-item element
        const repeatItem = this._createElement();

        if(position === 'before'){
            this.insertBefore(repeatItem, referenceNode);
            repeatItem.modelItem = this.modelItem.bind[this.repeatIndex-1];
        }else{
            this.insertBefore(repeatItem, referenceNode.nextSibling);
            repeatItem.modelItem = this.modelItem.bind[this.repeatIndex];
        }
        repeatItem.addEventListener('repeat-item-created', this._handleItemCreated.bind(this));
        repeatItem.init();

        if(position === 'after'){
            this.repeatIndex +=1;
        }
        return repeatItem;
    }

    _createElement(){
        const repeatItem = new XfRepeatItem();
        const clone = document.importNode(this.template.content, true);
        repeatItem.appendChild(clone);
        return repeatItem;
    }

    _handleItemCreated(e) {
        console.log('### _handleItemCreated ', e);

        if (!this.initDone) return;

        if (this.focusOnCreate) {
            const id = this.focusOnCreate;
            const focusControl = e.target.querySelector('#' + id);
            if(focusControl){
                focusControl.focus();
            }
        }
    }

    delete(repeatItem) {
        console.log('### repeat delete item ', repeatItem);

        // ### get the index of repeatItem within modelData
        const index = this.modelItem.bind.indexOf(repeatItem.modelItem);

        this.modelItem.bind.splice(index, 1);
        console.log('### repeatItems after delete ', this.repeatItems);

        // ### delete the repeatItem from the DOM
        this.removeChild(repeatItem);

        const items = this.querySelectorAll('xf-repeat-item');
        const cnt = items.length;

        const path = this.ownerForm.resolveBinding(this);

        // ### update the 'repeat-index' marker attribute
        this._removeIndexMarker();

        if (cnt !== 0) {
            if (index <= cnt - 1) {
                // ### if there's a repeat-item left with the same index as the deleted one it becomes the new repeat index
                items[index].setAttribute('repeat-index', '');
                this.repeatIndex = index+1;
            } else if (index > cnt - 1) {
                // ### if the last one is deleted the new last one will be new repeat-index
                items[cnt - 1].setAttribute('repeat-index', '');
                this.repeatIndex = cnt;
            }
        }
        this.dispatchEvent(new CustomEvent('repeat-item-deleted', {
            composed: true,
            bubbles: true,
            detail: {
                'bind': this.bind,
                'deleteLocation': index + 1,
                'deleteItems': repeatItem.modelItem,
                "path":path
            }
        }));

    }

    _getDataTemplate() {
        this.template = this.firstElementChild;
        console.log('### template found children ', this.template.content.children);

        let dataTmpl = [];
        Array.from(this.template.content.children).forEach(child => {
            this._processChild(child, dataTmpl);
        });
        if(dataTmpl.length === 0){
            console.error('### dataTemplate for repeat ', this.id, ' is empty');
        }
        return dataTmpl;
    }

    _processChild(child, dataTmpl){
        if (XfForm.isBoundComponent(child)) {
            const bindId = child.getAttribute('bind');
            if (bindId) {
                const newObj = {"id": bindId, "value": ""}; // create default object for insertion into repeat
                dataTmpl.push(newObj);
            }
        }
        const childs = child.children;
        if(childs.length !== 0){
            Array.from(childs).forEach(c => {
               this._processChild(c,dataTmpl);
            });
        }
        console.log('childs ', childs);
    }


}

window.customElements.define('xf-repeat', XfRepeat);
