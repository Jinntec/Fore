import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import { BoundElementMixin } from './BoundElementMixin.js';


/**
 * `xf-repeat`
 * an xformish form for eXist-db
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
export class XfRepeat extends BoundElementMixin(PolymerElement) {
/*
    static get template() {
        return html`
      <style>
        :host {
          display: block;
        }
        #repeatTmpl{
            
        }
      </style>
      <template id="repeatTmpl">
        <slot></slot>
      </template>
    `;
    }
*/

    static get properties() {
        return {
            bind:{
                type:String
            },
            template:{
                type: Object
            }
        };
    }


    connectedCallback() {
        super.connectedCallback();
        console.log('xf-repeat connected ', this);
    }

    init(proxy){
        super.init(proxy);
        console.log('init repeat from ', this.proxy);

        // ### there must be a single 'template' child
        this.template = this.firstElementChild;
        console.log('template ', this.template);
        if(this.template === null){
            console.warn('no template found for this repeat:', this.id);
        }

        const bindings = this.proxy.bind;
        bindings.forEach(item => {
           console.log('iterate bindings current item: ', item);
           this._unroll(item);
        });
        document.dispatchEvent(new CustomEvent('repeat-initialized'));

    }

    _unroll(item){
        console.log('_unroll binding ', item);
        console.log('_unroll binding ', this.proxy.bind.indexOf(item));

        const index = this.proxy.bind.indexOf(item);

        const clone = document.importNode(this.template.content, true);
        // console.log('clone ', clone);
        // console.log('clone first', clone.firstElementChild);
        clone.firstElementChild.classList.add('repeat-item');
        this.appendChild(clone);
    }

    _attachDom(dom) {
        this.appendChild(dom);
    }

}

window.customElements.define('xf-repeat', XfRepeat);
