import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import {BoundElementMixin} from './BoundElementMixin.js';
import {XfForm} from './xf-form.js';



/**
 * `xf-repeat-item`
 * an xformish form for eXist-db
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
export class XfRepeatItem extends BoundElementMixin(PolymerElement) {

    static get properties() {
        return {
            index:{
                type: Number
            }
        };
    }


    connectedCallback() {
        super.connectedCallback();
        console.log('### xf-repeat-item connected ', this);

        this.addEventListener('click',this._onClick);

    }

    _onClick(e){
        console.log('repeat-item click ', e);
    }

    init(){
        // super.init();
        console.log('### repeat item modelitem ', this.modelItem);
        const boundElements = this.querySelectorAll('[bind]');
        for (let i = 0; i < boundElements.length; i++) {
            console.log('##### init UI element ', boundElements[i], i + 1, ' of ', boundElements.length);
            const boundElement = boundElements[i];
            const bindId = boundElement.getAttribute('bind');
            boundElement.repeated = true;
            boundElement.modelItem = this.ownerForm.findById(this.modelItem,bindId);
            boundElement.init();
            // boundElement.applyProperties();
            // boundElement.attachListeners();
        }

    }

/*
    refresh() {
        console.log('### repeat item refresh');

    }

*/
    refresh(modelItem) {
        super.refresh(modelItem);
        // console.log('refresh repeat item from ', this.proxy);
        const boundElements = this.querySelectorAll('[bind]');
        for(let i = 0; i < boundElements.length; i++){
            const elem = boundElements[i];

            /*
            create proxy objects
             */
            if(XfForm.isBoundComponent(elem)){
                const bindId = elem.getAttribute('bind');
                // console.log('repeat-item child ', bindId);

                const b = this._resolve(bindId,elem,i);

                console.log('##### this.modelItem ',this.modelItem);
                const modelItem = this.ownerForm.createModelItem(b,this.index);

                elem.modelItem = modelItem;

                modelItem.addBoundElement(elem);
                // p.bound = elem;
                // this.ownerForm._addProxy(bindId,p);
                // this.ownerForm._addModelItem(bindId,modelItem);
                this._refreshElement(elem,modelItem);
            }
        }

        console.log('ownerForm modelItems ', this.ownerForm.modelItems);
    }


    /**
     * resolve binding by traversing the tree of bound elements upwards. Returns the proxy that is associated
     * to given bindId
     *
     *
     * todo: evaluate if this can be replaced with the 'resolve' in xf-form.
     *
     * @param bindId
     * @param element
     * @returns null or matching proxy
     * @private
     */
    _resolve(bindId, element){

        // console.log('>>>>> resolve proxy', bindId, element);
        // console.log('>>>>> resolve proxy', bindId, this.proxy);
        // console.log('>>>>> resolve index', this.index);
        // console.log('>>>>> resolve proxy for item', this.proxy.bind[this.index]);


        // ### try to find on repeat proxy first
        let target = this.modelItem.children[this.index].find(x => x.id === bindId);
        // console.log('>>>>> resolve modelData target', target);

        let parent = {};
        if(target !== undefined){
            return target;
        }else {
            // ### look upwards in repeat
            parent = element.parentNode;
            if(parent.hasAttribute('bind')){
                target = this._resolve(bindId, parent);
                // console.log('>>>>>> parent proxy ', p);
                if(target !== undefined){
                    return target;
                }else {
                    return this._resolve(bindId,parent);
                }
            } else if(parent.nodeName === 'XF-FORM'){
                console.log('xf-form uiStates reacher - outermost ', parent.modelItems);
                target = parent.modelItems[bindId][0];
                if(target !== undefined){
                    return target;
                }else {
                    return null;
                }
            } else {
                return this._resolve(bindId,parent);
            }
        }

    }

    delete(){
        console.log('deleting item at index:', this.index);
        const repeat = this.closest('xf-repeat');
        // repeat.delete(this);
        this.modelItem.delete();
    }

    _refreshElement(elem, modelItem){
        if (elem.nodeName.indexOf('-') > -1) {
            // ### initialize bound web component control
            if (typeof elem.refresh === 'function') {
                elem.refresh(modelItem);
            }
        } else {
            // ### initialize core HTML control
            // this.ownerForm._applyPropertiesToNativeControls(elem, modelItem);
            // this.ownerForm._attachListenerToNativeControls(elem, modelItem);
        }
    }


    _attachDom(dom) {
        this.appendChild(dom);
    }

}

window.customElements.define('xf-repeat-item', XfRepeatItem);
