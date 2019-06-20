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
            }
        };
    }


    connectedCallback() {
        super.connectedCallback();
        console.log('### xf-repeat connected ', this);
        this._initTemplate();

    }

    init() {
        super.init();
        this._initTemplate();
        this._initializeRepeatItems();
        this.initDone = true;
    }

    setCurrent(repeatItem) {
        const index = this.modelItem.bind.indexOf(repeatItem.modelItem);
        this._removeIndexMarker();
        this.querySelectorAll('xf-repeat-item')[index].setAttribute('repeat-index','');
    }

    _initTemplate() {
        // ### there must be a single 'template' child
        this.template = this.firstElementChild;
        console.log('##### template ', this.template);
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
        // ### iterate the 'bind' array as we do not have proxies yet
        const items = Array.from(this.modelItem.bind);
        this.modelItem.bind.forEach(item => {
            // console.log('_unroll binding ', item);
            const index = this.modelItem.bind.indexOf(item);
            this._createRepeatItem(index);
        });

        const first = this.querySelector('xf-repeat-item');
        first.setAttribute('repeat-index', '');
    }

    refresh() {
        const repeatItems = this.querySelectorAll('xf-repeat-item');
        for (let i = 0; i < repeatItems.length; i++) {
            const item = repeatItems[i];
            item.refresh();
        }
    }

    appendRepeatItem() {

        const dTmpl = this._getDataTemplate();
        console.log('dataTemplate from repeat ', dTmpl);

        // ### update the model (adding an entry to bind array)
        this.modelItem.bind.push(dTmpl);

        // ### create a repeat-item in the UI
        const index = this.modelItem.bind.length - 1;
        const item = this._createRepeatItem(index);

        item.setAttribute('repeat-index', '');

        this.dispatchEvent(new CustomEvent('repeat-item-appended', {
            composed: true,
            bubbles: true,
            detail: {'deleteLocation': index, 'appendedItem': item.modelItem}
        }));

    }

    _createRepeatItem(index) {
        // ### create a repeat-item and initialize it
        const repeatItem = new XfRepeatItem();
        const clone = document.importNode(this.template.content, true);
        repeatItem.appendChild(clone);
        this.appendChild(repeatItem);
        repeatItem.index = index;
        repeatItem.modelItem = this.modelItem.bind[index];
        repeatItem.addEventListener('repeat-item-created', this._handleItemCreated.bind(this));
        repeatItem.init();
        this._removeRepeatIndex();
        return repeatItem;
    }

    _removeRepeatIndex() {
        const lastItem = this.querySelector('[repeat-index]');
        if (lastItem) {
            lastItem.removeAttribute('repeat-index');
        }
    }

    _handleItemCreated(e) {
        console.log('### _handleItemCreated ', e);

        if (!this.initDone) return;

        if (this.focusOnCreate) {
            const id = this.focusOnCreate;
            const focusControl = e.target.querySelector('#' + id);
            focusControl.focus();
        }
    }

    delete(repeatItem) {
        console.log('### repeat delete item ', repeatItem);

        // ### get the index of repeatItem within modelData
        const index = this.modelItem.bind.indexOf(repeatItem.modelItem);
        // console.log('old item index ', index);

        this.modelItem.bind.splice(index, 1);
        // console.log('after modelItem delete ', this.modelItem.bind);

        // ### delete the repeatItem from the DOM
        this.removeChild(repeatItem);


        const items = this.querySelectorAll('xf-repeat-item');
        const cnt = items.length;

        // ### update the 'repeat-index' marker attribute
        // ##### remove current repeat-index marker
/*
        const oldmarker = this.querySelector('[repeat-index]');
        if (oldmarker) {
            // might not exist any more if current item is deleted
            oldmarker.removeAttribute('repeat-index');
        }
*/
        this._removeIndexMarker();


        if (cnt !== 0) {
            if (index <= cnt - 1) {
                // ### if there's a repeat-item left with the same index as the deleted one it becomes the new repeat index
                items[index].setAttribute('repeat-index', '');
            } else if (index > cnt - 1) {
                // ### if the last one is deleted the new last one will be new repeat-index
                items[cnt - 1].setAttribute('repeat-index', '');
            }
        }


        this.dispatchEvent(new CustomEvent('repeat-item-deleted', {
            composed: true,
            bubbles: true,
            detail: {'deleteLocation': index, 'deleteItems': repeatItem.modelItem}
        }));

    }

    _getDataTemplate() {
        console.log('##### template found children ', this.template.content.children);

        let tmp = [];
        Array.from(this.template.content.children).forEach(child => {
            console.log('####### child ', child);

            if (XfForm.isBoundComponent(child)) {
                console.log('######### bound child ', child);
                const bindId = child.getAttribute('bind');
                if (bindId) {
                    const newObj = {"id": bindId, "value": ""}; // create default object for insertion into repeat
                    tmp.push(newObj);
                }
            }
        });
        return tmp;
    }

    _removeIndexMarker() {
        const oldmarker = this.querySelector('[repeat-index]');
        if (oldmarker) {
            // might not exist any more if current item is deleted
            oldmarker.removeAttribute('repeat-index');
        }
    }

}

window.customElements.define('xf-repeat', XfRepeat);
