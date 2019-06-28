import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-dispatch`
 * general class for bound elements
 *
 * todo: implementation and demo
 *
 * @customElement
 * @polymer
 */
class XfDispatch extends PolymerElement {

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
        console.log('##### xf-dispatch executing bindId ', this.bind);


    }


}

window.customElements.define('xf-dispatch', XfDispatch);
