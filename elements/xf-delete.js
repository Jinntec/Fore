import { PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';

import { BoundElementMixin } from './BoundElementMixin.js';

/**
 * `xf-delete`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
// class XfDelete extends BoundElementMixin(PolymerElement) {
class XfDelete extends PolymerElement {

    static get properties() {
        return {
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('xf-delete attached');
        console.log('xf-delete proxy',this.proxy);

    }

/*
    refresh(proxy){
        super.refresh(proxy);
        console.log('xf-delete bound children: ', this.proxy.bind);
    }
*/

    execute(){
        console.log('xf-delete executing...');
        // console.log('xf-delete proxy ', this.proxy);
        // document.getElementById('r-todos').append();
        const repeatItem = this.closest('xf-repeat-item');
        console.log('enclosing repeat ', repeatItem);
        console.log('enclosing repeat proxy', repeatItem.proxy);
        repeatItem.delete();
    }

}

window.customElements.define('xf-delete', XfDelete);
