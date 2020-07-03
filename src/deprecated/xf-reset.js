import {html, PolymerElement} from '../../assets/@polymer/polymer';


/**
 * `xf-reset`
 * general class for bound elements
 *
 * todo: implementation and demo
 *
 * @customElement
 * @polymer
 */
class XfReset extends PolymerElement {

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
        console.log('##### xf-reset executing bindId ', this.bind);


    }


}

window.customElements.define('xf-reset', XfReset);
