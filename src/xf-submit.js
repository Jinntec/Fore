import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-append`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class XfSubmit extends PolymerElement {

    static get properties() {
        return {
            submission: {
                type: String
            },
        };
    }

    execute(){
        console.log('xf-submit executing...');
    }

}

window.customElements.define('xf-submit', XfSubmit);
