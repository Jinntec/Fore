import {html,css} from "lit-element";
import { unsafeHTML } from "lit-html/directives/unsafe-html";
import {repeat} from 'lit-html/directives/repeat.js';
import {BoundElement} from "../BoundElement.js";
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


    render() {
        return html`
            ${repeat(
            this.nodeset, // the array of items
            item => item.node, // the identify function
            (item, index) =>
                html`
                    <xf-repeatitem .nodeset="${item}" index="${index+1}" @repeatitem-created="${ (e) => this._doInit(e,index)}">
                        ${this._getTemplate()}
                    </xf-repeatitem>
            ` // the template for each item
        )}
        `;
    }

    _getTemplate(){
        console.log('###### getTemplate() ')
        return this.template.content.cloneNode(true);
    }

    _doInit(e,index){
        console.log('_doInit ', e.detail.item);
        console.log('_doInit ', index);
        const rItem = e.detail.item;
        // console.log('_doInit passing nodeset',rItem.nodeset);
        rItem.init();
        // rItem.refresh();
    }

    static get properties() {
        return {
            ... super.properties,
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

        this.template = this.firstElementChild;
        // this.addEventListener('repeatitem-created', this._refreshItem)

    }

    firstUpdated(_changedProperties) {
        this.init();
        console.log('firstupdated done');
    }

    init() {
        // ### there must be a single 'template' child
        console.log('##### repeat init');
        // if(!this.inited) this.init();
        // does not use this.evalInContext as it is expecting a nodeset instead of single node

        // this.updateComplete;
        this._evalNodeset();

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

        // this._initRepeatItems();

        this.inited = true;
    }

    /**
     * repeat has no own modelItems
     * @private
     */
    _evalNodeset(){
        const inscope = this._inScopeContext();
        this.nodeset = fx.evaluateXPathToNodes(this.ref, inscope, null, {});
    }

    /**
     * repeat has no own modelItems
     * @private
     */
    refresh(){
        console.log('repeat refresh ');
        // await this.updateComplete;
        const inscope = this._inScopeContext();
        this.nodeset = fx.evaluateXPathToNodes(this.ref, inscope, null, {});
        console.log('repeat refresh nodeset ', this.nodeset);
        Fore.refreshChildren(this);
        this.requestUpdate();
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

        const repeatItems = this.querySelectorAll('xf-repeatitem');
        Array.from(repeatItems).forEach(item => item.init(this.getModel()));
        //setting index to first

        // this.itemTemplates = [];

        // console.log('repeat ref ', this.ref);
        // console.log('repeat modelItems ', this.model.modelItems);
        // const modelItems = this.model.modelItems.filter(m => m.ref === this.ref);
        // console.log('repeat modelItems ', modelItems);

                // this.nodeset = this.evalBinding();
/*
                this.nodeset.forEach((item, index) => {

                    // console.log('initRepeatItem index ', index);
                    // const repeatItem = new XfRepeatitem(); //no idea why this is not working

                    const repeatItem = document.createElement('xf-repeatitem');

                    // console.log('initRepeatItem nodeset ',this.nodeset[index]);
                    repeatItem.nodeset = this.nodeset[index];
                    repeatItem.index = index +1; //1-based index
                    const content = this.template.content;
                    const clone = document.importNode(content, true);



                    // console.log('clone ', clone);
                    repeatItem.appendChild(clone);

                    this.itemTemplates.push(html`repeatItem`);

                    this.appendChild(repeatItem);
                });
*/


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
