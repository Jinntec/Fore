import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-setvalue`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 */
class XfSetvalue extends PolymerElement {

    static get properties() {
        return {
            submission: {
                type: String
            },
        };
    }

    execute(){
        console.log('xf-setvalue executing...');
    }

}

window.customElements.define('xf-submit', XfSetvalue);
