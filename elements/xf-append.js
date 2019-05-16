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
        };
    }

    execute(){
        console.log('xf-append executing...');
        // document.getElementById('r-todos').append();

        // todo: signal the form to append an entry to the list of bound nodes

    }

}

window.customElements.define('xf-append', XfAppend);
