import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import {BoundElementMixin} from './BoundElementMixin.js';
import {XfRepeatItem} from './xf-repeat-item.js';


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
            bind: {
                type: String
            },
            template: {
                type: Object
            },
            index: {
                type: Number,
                value: 1
            }
        };
    }


    connectedCallback() {
        super.connectedCallback();
        console.log('xf-repeat connected ', this);

        /*
                window.addEventListener('WebComponentsReady', function () {
                    console.log('repeat bound to proxy ', this.proxy);
                    this._unroll();
                }.bind(this));
        */

        // console.log('this content aka template ', this.firstElementChild);

    }

    refresh(proxy) {
        super.refresh(proxy);
        console.log('refresh repeat from ', this.proxy);

        // ### remove all repeat-items that might have been there already
        this.querySelectorAll('xf-repeat-item').forEach(item => {
            this.removeChild(item);
        });

        // ### there must be a single 'template' child
        this.template = this.firstElementChild;
        // console.log('template ', this.template);
        if (this.template === null) {
            console.warn('no template found for this repeat:', this.id);
        }

        this._unroll();
        document.dispatchEvent(new CustomEvent('repeat-initialized'));

    }

    delete(repeatItem) {
        console.log('repeat delete item ', repeatItem);
        const repeat = this.closest('xf-repeat');
        this.proxy.delete = repeatItem.index;
        // this.removeChild(repeatItem);
        this.refresh(this.proxy);
        this.dispatchEvent(new CustomEvent('xf-delete', {
            composed: true,
            bubbles: true,
            detail: {'deleteLocation': repeatItem.index, 'deleteItems': repeatItem.proxy}
        }));

    }

    _unroll() {
        // const bindings = this.proxy.bind;
        const bindings = this.proxy.proxies;

        bindings.forEach(item => {

            console.log('_unroll binding ', item);
            console.log('_unroll binding ', this.proxy.proxies.indexOf(item));

            //todo: add entry to data-modelData
            const index = this.proxy.proxies.indexOf(item);

            // const tmpl = this.firstElementChild;
            // console.log('template for repeat ', tmpl);

            // ### create a repeat-item
            const repeatItem = new XfRepeatItem();
            const clone = document.importNode(this.template.content, true);

            // console.log('clone ', clone);
            // console.log('clone first', clone.firstElementChild);
            // clone.firstElementChild.classList.add('repeat-item');

            // this.appendChild(clone);

            repeatItem.appendChild(clone);
            this.appendChild(repeatItem);
            repeatItem.index = index;
            repeatItem.refresh(item);
        });


    }

    _attachDom(dom) {
        this.appendChild(dom);
    }

}

window.customElements.define('xf-repeat', XfRepeat);
