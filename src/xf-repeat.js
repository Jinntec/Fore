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
export class XfRepeated extends BoundElement {

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
    }


    firstUpdated(_changedProperties) {
        console.log('### xf-repeat firstUpdated ', this);
        console.log('### xf-repeat firstUpdated index', this.repeatIndex);
        // this.init();
        this._initTemplate();
    }

    refresh() {
        console.log('REPEAT.refresh');
        this.nodeset = this.evalBinding();
        console.log('REPEAT.refresh ', this.nodeset);
        this.requestUpdate();
        //create n repeat-items for nodeset
        this.nodeset.forEach( item => {
            // const repeatItem = new XfRepeatitem();
            const repeatItem = document.createElement('xf-repeatitem');
            const content = this.template.content;
            const clone = document.importNode(content, true);
            console.log('clone ', clone);
            repeatItem.appendChild(clone);
            this.appendChild(repeatItem);
        });

/*
        const repeatItems = this.querySelectorAll('xf-repeat-item');
        for (let i = 0; i < repeatItems.length; i++) {
            const item = repeatItems[i];
            item.refresh();
        }
*/
    }

    _initTemplate() {
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
        this.requestUpdate();
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

window.customElements.define('xf-repeat', XfRepeated);
