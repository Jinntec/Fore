import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-return`
 * general class for bound elements
 *
 * todo: implementation and demo
 *
 * @customElement
 * @polymer
 */
class XfReturn extends PolymerElement {

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
        console.log('##### xf-return executing bindId ', this.bind);


    }


}

window.customElements.define('xf-return', XfReturn);
