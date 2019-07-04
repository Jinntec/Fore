import {PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import {XfAction} from './xf-action.js';


/**
 * `xf-setvalue`
 *
 * @customElement
 * @polymer
 */
class XfSetvalue extends XfAction {

    static get properties() {
        return {
            bind: {
                type: String,
                reflectToAttribute: true
            },
            value: {
                type: String
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('xf-setvalue connected ');
    }

    init(){
        super.init();
    }

    execute() {

        const repeated = this.closest('xf-repeat-item');
        if(repeated){
            const item = repeated.modelItem;
            const target = this.ownerForm.findById(item,this.bind);
            target.value = this.value;
            this.dispatchEvent(new CustomEvent('value-changed', {
                composed: true,
                bubbles: true,
                detail: {'modelItem': target}
            }));

        }else{
            this.modelItem.value = this.value;
            this.dispatchEvent(new CustomEvent('value-changed', {
                composed: true,
                bubbles: true,
                detail: {'modelItem': this.modelItem}
            }));
        }

        return true;
    }

}

window.customElements.define('xf-setvalue', XfSetvalue);
