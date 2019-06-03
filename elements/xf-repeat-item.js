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
        console.log('refresh repeat item from ', this.proxy);

        const boundElements = this.querySelectorAll('[bind]');
        for(let i = 0; i < boundElements.length; i++){
            const elem = boundElements[i];
            const bindId = elem.getAttribute('bind');

            //todo: proxy might not exist - should behave like not relevant
            // ### lookup proxy in local proxy
            let targetProxy = proxy.find(p=> p.id === bindId);
            // console.log('repeat targetProxy ', targetProxy);

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
