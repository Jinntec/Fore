import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-insert`
 * general class for bound elements
 *
 * todo: implementation and demo
 *
 * @customElement
 * @polymer
 */
class XfInsert extends PolymerElement {

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
        console.log('##### xf-insert executing bindId ', this.bind);


    }


}

window.customElements.define('xf-insert', XfInsert);
