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
class XfSetindex extends PolymerElement {

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

    init(){
        super.init();
    }

    execute(){
        console.log('##### xf-setindex executing bindId ', this.bind);


    }


}

window.customElements.define('xf-setindex', XfSetindex);
