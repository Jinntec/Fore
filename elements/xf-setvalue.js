import {PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import { BoundElementMixin } from './BoundElementMixin.js';


/**
 * `xf-setvalue`
 *
 * @customElement
 * @polymer
 */
class XfSetvalue extends PolymerElement {

    static get properties() {
        return {
            bind: {
                type: String,
                reflectToAttribute:true
            },
            value:{
                type: String
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('xf-setvalue connected ');
    }

    execute(){
        // console.log('xf-setvalue executing...');
        // console.log('xf-setvalue bind ', this.bind);
        // const proxy = this.closest('xf-form').getProxy(this.bind);
        // console.log('setvalue proxy ', proxy);
        const state = this.closest('xf-form').resolve(this.bind,this);
        state.value =  this.value;
        return true;
    }

}

window.customElements.define('xf-setvalue', XfSetvalue);
