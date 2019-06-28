import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-set-index`
 * general class for bound elements
 *
 * todo: implementation and demo
 *
 * @customElement
 * @polymer
 */
class XfSetIndex extends PolymerElement {

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
        console.log('##### xf-set-index executing bindId ', this.bind);


    }


}

window.customElements.define('xf-set-index', XfSetIndex);
