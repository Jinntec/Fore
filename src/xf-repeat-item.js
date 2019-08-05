import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';



/**
 * `xf-repeat-item`
 *
 * A xf-repeat-item is a wrapper around each entry within a repeat. It gets created during init of `xf-repeat`.
 *
 *
 *
 * @customElement
 * @polymer
 */
export class XfRepeatItem extends PolymerElement {

    static get template() {
        return html`
          <style>
            :host {
              display: block;
              padding: 2px;
            }
            :host([repeat-index]){
                background: #29B6F6;
            }
          </style>
          <slot></slot>
        `;
    }

    static get properties() {
        return {
/*
            index:{
                type: Number
            }
*/
            modelItem:{
                type: Object,
                observer:'_debug'
            }
        };
    }

    _debug(oldval, newVal){
        console.log('modelItem changed now is', this.modelItem);

    }

    connectedCallback() {
        super.connectedCallback();
        console.log('### xf-repeat-item for ', this.parentNode.id ,'connected ', this);

        this.addEventListener('click',this._onClick);
    }

    _onClick(e){
        console.log('repeat-item click ', e);

        if(this.parentNode){
            this.parentNode.setCurrent(this);
        }
    }

    /**
     * xf-repeat-item is special. Though it gets a modelItem through its parent repeat it is not a BoundElement
     * itself. Like bound elements it has an `init` method but it's not inherited. It does not get its modelItem
     * passed in but searches it within its own scope.
     */
    init(){
        console.log('### repeat item of ', this.parentNode,' modelitem ', this.modelItem);
        // console.table(this.modelItem);
        const boundElements = this.querySelectorAll('[bind]');
        console.group('initRepeatItem');
        for (let i = 0; i < boundElements.length; i++) {
            console.log('### init UI element ', boundElements[i], i + 1, ' of ', boundElements.length);
            const boundElement = boundElements[i];
            const bindId = boundElement.getAttribute('bind');
            boundElement.repeated = true;
            boundElement.modelItem = this.closest('xf-form').findById(this.modelItem,bindId);

            // ### if there's no modelItem yet create one
/*
todo: unsure what was the intend here - can that be right? At least causes problem with repeatIndex
            if(!boundElement.modelItem){
                this.modelItem = {};
                this.modelItem.bind = [];
            }
*/

            if(boundElement.modelItem){
                boundElement.init();
            }
        }
        console.groupEnd('initRepeatItem');

        this.dispatchEvent(new CustomEvent('repeat-item-created', {composed: true, bubbles: true, detail: {}}));
    }

    /**
     * when xf-repeat-item is refreshed it in turn refreshes all of its bound children.
     */
    refresh() {
        console.log('### repeat item refresh');
        const boundElements = this.querySelectorAll('[bind]');
        for(let i = 0; i < boundElements.length; i++){
            const elem = boundElements[i];
            const bindId = elem.getAttribute('bind');
            if (typeof elem.refresh === 'function') {
                elem.refresh();
            }
        }
    }


    delete(){
        const repeat = this.closest('xf-repeat');
        repeat.delete(this);
    }


/*
    _attachDom(dom) {
        this.appendChild(dom);
    }
*/

}

window.customElements.define('xf-repeat-item', XfRepeatItem);
