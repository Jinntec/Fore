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
class XfDelete extends PolymerElement {

    static get properties() {
        return {
            bind: {
                type: String
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('### xf-delete connected');
    }

/*
    refresh(proxy){
        super.refresh(proxy);
        console.log('xf-delete bound children: ', this.proxy.bind);
    }
*/

    execute(){
        console.log('##### xf-delete executing...');
        // console.log('xf-delete proxy ', this.proxy);
        // document.getElementById('r-todos').append();
        // const repeatItem = this.closest('xf-repeat-item');
        // console.log('enclosing repeat ', repeatItem);
        // console.log('enclosing repeat uiState', repeatItem.modelItem);
        // repeatItem.delete();

        if(this.bind){
            const modelItem = this.closest('xf-form').resolve(this.bind,this);
            const repeatItem = this.closest('xf-repeat-item');
            modelItem.delete(repeatItem.index);

            // todo: there would be cheaper ways to update the UI...
            this.closest('xf-form').refresh();
        }/*else{
            // ### if no 'bind' is present we assume being a child of a repeat
            const repeatItem = this.closest('xf-repeat-item');
            if(repeatItem){

            }else{
                console.error('delete action is not bound');
            }


        }*/


    }

}

window.customElements.define('xf-delete', XfDelete);
