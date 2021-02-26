// import {LitElement,html, css} from "lit-element";
import {Fore} from "../fore.js";
import {XfContainer} from "./xf-container";


/**
 * `xf-repeat`
 * an xformish form for eXist-db
 *
 * @customElement
 * @demo demo/index.html
 */
export class XfRepeatitem extends XfContainer{

/*
    static get styles() {
        return css`
            :host {
              display: block;
            }
        `;
    }
*/

    static get properties() {
        return {
            index:{
                type:Number
            },
            inited:{
                type:Boolean
            }
        };
    }

    constructor(){
        super();
        this.inited = false;
        this.addEventListener('click', e =>{
            console.log('clicked on index ', this.index);
            if(this.parentNode){
                this.parentNode.dispatchEvent(new CustomEvent('index-changed', {composed: true, bubbles: true, detail: {index:this.index}}));
            }

        })
    }

    init(){
        console.log('repeatitem init model ', this.nodeset);
        this._initializeChildren(this);
        this.inited = true;
    }

    getModelItem(){
        super.getModelItem();
        console.log('modelItem in repeatitem ', this.getModelItem()[this.index]);
        return this.getModelItem()[this.index];
    }

    _initializeChildren(node) {
        const children = Array.from(node.children);
        console.log('_initializeChildren ', children);

        children.forEach(child => {
            if (Fore.isUiElement(child.nodeName)) {
                child.repeated = true;
            } else if (child.children.length !== 0) {
                const grantChildren = Array.from(child.children);
                grantChildren.forEach(grantChild => {
                    this._initializeChildren(grantChild);
                });
            }

        });
    }

    firstUpdated(_changedProperties) {
        // console.log('### xf-repeatitem firstUpdated index ', this.index);
        // console.log('### xf-repeatitem firstUpdated nodeset ', this.nodeset);
        // console.log('### xf-repeatitem firstUpdated model ', this.model);
        this.dispatchEvent(new CustomEvent('repeatitem-created', {
            composed: true,
            bubbles: true,
            detail: {item: this}
        }));
        // this.init();
    }

    updated(_changedProperties) {
        super.updated(_changedProperties);

/*
        this.dispatchEvent(new CustomEvent('repeatitem-created', {
            composed: true,
            bubbles: true,
            detail: {item: this}
        }));
*/
    }

    refresh(){
        console.log('refresh repeatitem: ',this.nodeset);
        if(!this.inited){
            this.init();
        }
        console.log('refresh repeatitem nodeset: ',this.nodeset);
        // super.refresh();
        Fore.refreshChildren(this);
        // super.refresh();
        // await this.updateComplete;
/*
        this.evalInContext();
        this.modelItem = this.getModelItem();

        Fore.refreshChildren(children);
*/
        // this.requestUpdate();
    }

/*
    updateChildren(children){
        children.forEach(element => {

            //todo: later - check for AVTs
            // if(!element.nodeName.toLowerCase().startsWith('xf-')) return;
            // if(element.nodeName.toLowerCase() === 'xf-repeat') return;

            if (typeof element.refresh === 'function') {
                // console.log('refresh bound element ', bound);
                // console.log('# refresh element ', element);
                element.refresh();
            }

        });

    }
*/



    createRenderRoot() {
        /**
         * Render template without shadow DOM. Note that shadow DOM features like
         * encapsulated CSS and slots are unavailable.
         */
        return this;
    }

}

window.customElements.define('xf-repeatitem', XfRepeatitem);
