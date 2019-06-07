import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-append`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class XfAppend extends PolymerElement {

    static get properties() {
        return {
            bind: {
                type: String
            }
        };
    }

    execute(){
        console.log('##### xf-append executing bindId ', this.bind);

        const modelItem = this.closest('xf-form').resolve(this.bind,this);

        console.log('##### proxy for append ', modelItem);
        // console.log('##### dataTemplate append ', modelItem.dataTemplate.slice());
        // const p = this.closest('xf-form')

        modelItem.append();

        this.closest('xf-form').dispatchEvent(new CustomEvent('item-appended', {composed: true, bubbles: true, detail: {"bind":this.bind}}));

    }

    isBoundComponent(element){
        return (window.BOUND_ELEMENTS.indexOf(element) > -1);
    }

}

window.customElements.define('xf-append', XfAppend);
