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
        repeat.appendRepeatItem();

    }


}

window.customElements.define('xf-append', XfAppend);
