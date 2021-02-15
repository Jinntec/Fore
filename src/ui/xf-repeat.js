import {html,css} from "lit-element";
import "./xf-repeatitem.js";
import * as fx from "fontoxpath";
import {XfContainer} from "./xf-container.js";

import {Fore} from "../fore";

/**
 * `xf-repeat`
 * an xformish form for eXist-db
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
export class XfRepeat extends XfContainer {

    static get styles() {
        return css`
            :host {
              display: block;
            }
        `;
    }

    static get properties() {
        return {
            ... super.properties,
            index:{
                type: Number
            },
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
        this.dataTemplate = [];
        this.focusOnCreate = '';
        this.initDone = false;
        this.repeatIndex = 1;
        this.nodeset = [];
        this.inited = false;
        this.index = 1;

        // this.template = this.firstElementChild;
        // this.addEventListener('repeatitem-created', this._refreshItem)

    }

    render() {
        return html`
            <slot></slot>
        `;
    }


    setIndex(index){
        if(this.index !== index){
            this.index=index;
            console.log('new repeat index ', index);
        }
    }

    connectedCallback() {
        super.connectedCallback();
        // console.log('### XfControl connected ', this);
        this.addEventListener('index-changed', e => {
           this.index = e.detail.index;
           const rItems = this.querySelectorAll('xf-repeatitem');
           this._setIndex(rItems[this.index-1]);
        });
    }


    init() {
        // ### there must be a single 'template' child
        console.log('##### repeat init');
        // if(!this.inited) this.init();
        // does not use this.evalInContext as it is expecting a nodeset instead of single node
        this._evalNodeset();
        console.log('##### repeat nodeset ', this.nodeset);

        this._initTemplate();
        this._initRepeatItems();

        this.setAttribute('index',this.index);

        this.inited = true;
    }

    /**
     * repeat has no own modelItems
     * @private
     */
    _evalNodeset(){
        const inscope = this._inScopeContext();
        console.log('##### inscope ', inscope);
        console.log('##### ref ', this.ref);
        this.nodeset = fx.evaluateXPathToNodes(this.ref, inscope, null, {});
    }

    /**
     * repeat has no own modelItems
     * @private
     */
/*
    _refresh(){
        console.log('repeat refresh ');
        // await this.updateComplete;
        const inscope = this._inScopeContext();
        this.nodeset = fx.evaluateXPathToNodes(this.ref, inscope, null, {});
        console.log('repeat refresh nodeset ', this.nodeset);


        const rItems = this.querySelectorAll('xf-repeatitem');


        // this._initRepeatItems();
        Fore.refreshChildren(this);
        this.requestUpdate();
    }
*/

    refresh() {
        console.group('xf-repeat.refresh');
        if(!this.inited) this.init();

        const inscope = this._inScopeContext();
        this.nodeset = fx.evaluateXPathToNodes(this.ref, inscope, null, {});
        console.log('repeat refresh nodeset ', this.nodeset);

        // super.refresh();


        // this.requestUpdate();
        //create n repeat-items for nodeset

        //todo: obviously buggy - just works initially but then for each refresh will create new items - to be fixed


        let repeatItems = this.querySelectorAll('xf-repeatitem');
        const repeatItemCount = repeatItems.length;

        let nodeCount = 1;
        if(Array.isArray(this.nodeset)){
            nodeCount = this.nodeset.length;
        }

        // const contextSize = this.nodeset.length;
        const contextSize = nodeCount;
        let modified = [];
        if (contextSize < repeatItemCount){

            for(let position = repeatItemCount; position > contextSize; position--){
                //remove repeatitem
                const itemToRemove = repeatItems[position -1];
                itemToRemove.parentNode.removeChild(itemToRemove);
                // modified.push(itemToRemove);
            }

            //todo: update index
        }

        if(contextSize > repeatItemCount){

            for(let position = repeatItemCount +1; position <= contextSize; position++){
                //add new repeatitem
                const lastRepeatItem = repeatItems[repeatItemCount-1];
                const newItem = lastRepeatItem.cloneNode(true);
                newItem.nodeset = this.nodeset[position-1];
                newItem.index = position;
                this.appendChild(newItem);
                modified.push(newItem);

            }


        }
/*
        if(modified.length > 0){
            modified.forEach(mod => {
                mod.refresh();
            })
        }

        if(contextSize == repeatItemCount){
            Fore.refreshChildren(this);
        }
*/
        Fore.refreshChildren(this);

        /*
                if(repeatItems){
                    repeatItems = this.querySelectorAll('xf-repeatitem');
                    repeatItems.forEach(bound => {
                        bound.refresh();
                    });
                }
        */

        console.groupEnd();
    }


    _initTemplate() {
        // ### there must be a single 'template' child

        const defaultSlot = this.shadowRoot.querySelector('slot');
        const template =  defaultSlot.assignedElements({flatten: true})[0];
        console.log('>>>> template ', template);


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


/* 
    refresh() {
        console.group('xf-repeat.refresh');
        if(!this.inited) this.init();
        // this.nodeset = this.evalBinding();
        // this.nodeset = fx.evaluateXPathToNodes(this.ref, this.model.getDefaultInstance().getDefaultContext(), null, {});
        // this._evalNodeset();


        console.log('REPEAT.refresh nodeset ', this.nodeset);
        // this.requestUpdate();
        //create n repeat-items for nodeset

        //todo: obviously buggy - just works initially but then for each refresh will create new items - to be fixed


        // this._refreshChildren(repeatItems);

        this.requestUpdate();
        console.groupEnd();
    }

 */
/*
    _refreshChildren(repeatItems){
        if(repeatItems){
            repeatItems = this.querySelectorAll('xf-repeatitem');
            repeatItems.forEach(bound => {
                bound.refresh();
            });
        }
    }
*/

    _refreshItem(e){
        if(!this.inited) return;
        e.detail.item.refresh();
    }


    _initRepeatItems() {
        const model = this.getModel();

        // this.nodeset = fx.evaluateXPathToNodes(this.ref, model.getDefaultInstance().getDefaultContext(), null, {});
        console.log('repeat nodeset ', this.nodeset);

        // const repeatItems = this.querySelectorAll('xf-repeatitem');
        // Array.from(repeatItems).forEach(item => item.init(this.getModel()));
        //setting index to first

        this.itemTemplates = [];

        this.textContent = '';

        // console.log('repeat ref ', this.ref);
        // console.log('repeat modelItems ', this.model.modelItems);
        // const modelItems = this.model.modelItems.filter(m => m.ref === this.ref);
        // console.log('repeat modelItems ', modelItems);

        this.nodeset.forEach((item, index) => {

            // console.log('initRepeatItem index ', index);
            // const repeatItem = new XfRepeatitem(); //no idea why this is not working

            const repeatItem = document.createElement('xf-repeatitem');

            // console.log('initRepeatItem nodeset ',this.nodeset[index]);
            repeatItem.nodeset = this.nodeset[index];
            repeatItem.index = index +1; //1-based index

            const clone = this._clone();
            // const content = this.template.content.cloneNode(true);
            // const clone = document.importNode(content, true);

            // console.log('clone ', clone);
            repeatItem.appendChild(clone);
            this.itemTemplates.push(html`repeatItem`);
            this.appendChild(repeatItem);
            if(repeatItem.index === 1){
                this._setIndex(repeatItem);
            }
        });


    }

    _clone() {
        const content = this.template.content.cloneNode(true);
        return document.importNode(content, true);
    }


    _setIndex(repeatItem){
        this._removeIndexMarker();
        if(repeatItem){
            repeatItem.setAttribute('repeat-index','');
        }
    }

    _removeIndexMarker() {
        Array.from(this.children).forEach( item => {
            item.removeAttribute('repeat-index');
        });
    }

/*
    createRenderRoot() {
        return this;
    }
*/
}

window.customElements.define('xf-repeat', XfRepeat);
