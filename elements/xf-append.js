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
            },
            repeat:{
                type: String
            }
        };
    }

    execute(){
        console.log('##### xf-append executing bindId ', this.bind);

        // ### get repeat and _dataTemplate
        const repeat = document.getElementById(this.repeat);
        const dTmpl = repeat._getDataTemplate();
        console.log('dataTemplate from repeat ', dTmpl);

        // const modelItem = this.closest('xf-form').resolve(this.bind,this);
        const modelItem = repeat.modelItem;
        modelItem.append(dTmpl);
        this.closest('xf-form').dispatchEvent(new CustomEvent('item-appended', {composed: true, bubbles: true, detail: {"bind":this.bind}}));

    }

    isBoundComponent(element){
        return (window.BOUND_ELEMENTS.indexOf(element) > -1);
    }

}

window.customElements.define('xf-append', XfAppend);
