import {html,css} from "lit-element";
import {BoundElement} from "./BoundElement.js";
// import { unsafeHTML } from "lit-html/directives/unsafe-html";
import "./xf-repeatitem.js"

/**
 * `xf-repeat`
 * an xformish form for eXist-db
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
export class XfRepeat extends BoundElement {

    static get styles() {
        return css`
            :host {
              display: block;
            }
        `;
    }


/*
    render() {
        return html`
            ${this.nodeset.map(node =>
                html`<xf-repeat-item><slot></slot></xf-repeat-item>`
            )}
        `;
    }
*/



    static get properties() {
        return {
            ref: {
                type: String
            },
            template: {
                type: Object
            },
            focusOnCreate: {
                type: String
            },
            initDone: {
                type: Boolean
            },
            repeatIndex:{
                type: Number
            },
            nodeset:{
                type: Array
            }
        };
    }

    constructor(){
        super();
        this.ref='';
        this.template={};
        this.dataTemplate = [];
        this.focusOnCreate = '';
        this.initDone = false;
        this.repeatIndex = 1;
        this.nodeset = [];
        this.inited = false;
        // this.addEventListener('repeatitem-created', this._refreshItem)

    }


    firstUpdated(_changedProperties) {
        // console.log('### xf-repeat firstUpdated ', this);
        // console.log('### xf-repeat firstUpdated index', this.repeatIndex);
        // this.init();
        this._init();

    }

    refresh() {
        if(!this.inited) return;
        this.nodeset = this.evalBinding();
        // super.refresh();


        console.log('REPEAT.refresh ', this.nodeset);
        this.requestUpdate();
        //create n repeat-items for nodeset

        //todo: obviously buggy - just works initially but then for each refresh will create new items - to be fixed


        const repeatItems = this.querySelectorAll('xf-repeatitem');
        const repeatItemCount = repeatItems.length;
        console.log('repeatitems ', repeatItems);


        const contextSize = this.nodeset.length;
        if (contextSize < repeatItemCount){

            for(let position = repeatItemCount; position > contextSize; position-1){
                //remove repeatitem
                const itemToRemove = repeatItems[position -1];
                itemToRemove.parentNode.removeChild(itemToRemove);
            }

        }

        if(contextSize > repeatItemCount){

            for(let position = repeatItemCount +1; position <= contextSize; position++){
                //add new repeatitem
                const lastRepeatItem = repeatItems[repeatItemCount-1];
                this.appendChild(lastRepeatItem.cloneNode(true));


            }


        }

        if(repeatItems){
            repeatItems.forEach(bound => {
                /** @type (BoundElement) */ (bound).refresh();
            });
        }


    }


    _refreshItem(e){
        if(!this.inited) return;
        e.detail.item.refresh();
    }

    _init() {
        // ### there must be a single 'template' child
        this.template = this.firstElementChild;
        // this.template = this.querySelector('template');
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
        this._initRepeatItems();
        this.requestUpdate();
        this.inited = true;
    }

    _initRepeatItems() {
        this.nodeset = this.evalBinding();
        this.nodeset.forEach((item, index) => {
            console.log('initRepeatItem index ', index);
            // const repeatItem = new XfRepeatitem(); //no idea why this is not working
            const repeatItem = document.createElement('xf-repeatitem');
            console.log('initRepeatItem nodeset ',this.nodeset[index]);
            repeatItem.nodeset = this.nodeset[index];
            repeatItem.index = index +1; //1-based index
            const content = this.template.content;
            const clone = document.importNode(content, true);
            console.log('clone ', clone);
            repeatItem.appendChild(clone);
            this.appendChild(repeatItem);
        });
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

    createRenderRoot() {
        /**
         * Render template without shadow DOM. Note that shadow DOM features like
         * encapsulated CSS and slots are unavailable.
         */
        return this;
    }

}

window.customElements.define('xf-repeat', XfRepeat);
