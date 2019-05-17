import {PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


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
        console.log('xf-setvalue executing...');
        console.log('xf-setvalue bind ', this.bind);
        console.log('parent form ', this.closest('xf-form').getProxy(this.bind));
        const proxy = this.closest('xf-form').getProxy(this.bind);
        console.log('setvalue proxy ', proxy);
        proxy.value =  this.value;
        return true;
    }

}

window.customElements.define('xf-setvalue', XfSetvalue);
