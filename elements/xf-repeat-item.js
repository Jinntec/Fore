import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import {BoundElementMixin} from './BoundElementMixin.js';


/**
 * `xf-repeat-item`
 * an xformish form for eXist-db
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
export class XfRepeatItem extends BoundElementMixin(PolymerElement) {
/*
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
*/

    static get properties() {
        return {
            index:{
                type: Number
            }
        };
    }


    connectedCallback() {
        super.connectedCallback();
        console.log('xf-repeat-item connected ', this);

        this.addEventListener('click',this._onClick);

    }

    _onClick(e){
        console.log('repeat-item click ', e);
    }

    refresh(proxy) {
        super.refresh(proxy);
        // console.log('refresh repeat item from ', this.proxy);

        const boundElements = this.querySelectorAll('[bind]');
        for(let i = 0; i < boundElements.length; i++){
            const elem = boundElements[i];

            /*
            create proxy objects
             */
            if(window.BOUND_ELEMENTS.indexOf(elem.nodeName.toUpperCase()) !== -1){
                const bindId = elem.getAttribute('bind');
                // console.log('repeat-item child ', bindId);

                const b = this._resolve(bindId,elem,i);

                console.log('################### this.proxy ',this.proxy);
                console.log('################### b ',b);
                const p = this.ownerForm.createBindProxy(b,this.index);
                console.log('################### new proxy ',p);

                elem.proxy = p;
                p.bound = elem;
                this.ownerForm._addProxy(bindId,p);
                this._refreshElement(elem,p);
            }





            // const newProxy = elem.createProxy(i);
            // let targetProxy = this.proxy.bind.find(p=> p.id === bindId);
            // console.log('repeat targetProxy ', targetProxy);
            // console.log('<<<<<<<<<<<<<<<<<<<<<< repeat-item bind',this.proxy.bind[i]);
            // const newProxy = this.closest('xf-form').createBindProxy()
            // console.log('>>>>>>>>>>>>>>>>>> created repeat-item proxy ', newProxy);

/*
            let targetProxy = this.proxy.find(p=> p.id === bindId);
            console.log('repeat targetProxy ', targetProxy);

            // ### look for proxy matching the bind id of the control at hand
            if(targetProxy){
                targetProxy.bound = elem;
                console.log('repeat targetProxy ', targetProxy);
                this._refreshElement(elem,targetProxy);
            } else{
                const p = this.ownerForm.getProxy(bindId, this.index);
                console.log('repeat targetProxy ', p);
                p.bound = elem;
                this._refreshElement(elem,p);
            }

*/

        }

        console.log('ownerForm proxies ', this.ownerForm.proxies);
    }


    /**
     * resolve binding by traversing the tree of bound elements upwards. Returns the proxy that is associated
     * to given bindId
     *
     *
     * @param bindId
     * @param element
     * @returns null or matching proxy
     * @private
     */
    _resolve(bindId, element){

        // console.log('>>>>> resolveProxy proxy', bindId, element);
        // console.log('>>>>> resolveProxy proxy', bindId, this.proxy);
        // console.log('>>>>> resolveProxy index', this.index);
        // console.log('>>>>> resolveProxy proxy for item', this.proxy.bind[this.index]);


        // ### try to find on repeat proxy first
        let target = this.proxy.bind[this.index].find(x => x.id === bindId);
        // console.log('>>>>> resolveProxy modelData target', target);

        let parent = {};
        if(target !== undefined){
            return target;
        }else {
            // ### look upwards in repeat proxy
            parent = element.parentNode;
            if(parent.hasAttribute('bind')){
                target = this._resolve(bindId, parent);
                // console.log('>>>>>> parent proxy ', p);
                if(target !== undefined){
                    return target;
                }else {
                    // const b = this._resolve(bindId,parent,index);
                    // const p = this.ownerForm.createBindProxy(b,index);
                    // return p;
                    return this._resolve(bindId,parent);
                }
            } else if(parent.nodeName === 'XF-FORM'){
                console.log('xf-form proxies reacher - outermost ', parent.proxies);
                target = parent.proxies[bindId][0];
                if(target !== undefined){
                    return target;
                }else {
                    return null;
                }
            } else {
                // const b = this._resolve(bindId,parent,index);
                // const p = this.ownerForm.createBindProxy(b,index);
                // return p;

                return this._resolve(bindId,parent);
            }
        }

    }

    delete(){
        console.log('deleting item at index:', this.index);
        const repeat = this.closest('xf-repeat');
        repeat.delete(this);
    }

    _refreshElement(elem, proxy){
        if (elem.nodeName.indexOf('-') > -1) {
            // ### initialize bound web component control
            if (typeof elem.refresh === 'function') {
                elem.refresh(proxy);
            }
        } else {
            // ### initialize core HTML control
            this.ownerForm._applyPropertiesToNativeControls(elem, proxy);
            this.ownerForm._attachListenerToNativeControls(elem, proxy);
        }
    }


    _attachDom(dom) {
        this.appendChild(dom);
    }

}

window.customElements.define('xf-repeat-item', XfRepeatItem);
