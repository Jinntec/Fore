import {html, PolymerElement} from '../../assets/@polymer/polymer';


/**
 * `xf-load`
 * resolve and traverse a link just like the HTML `a` element.
 *
 * todo: implementation and demo
 *
 * @customElement
 * @polymer
 */
class XfLoad extends PolymerElement {

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
        console.log('##### xf-load executing bindId ', this.bind);


    }


}

window.customElements.define('xf-load', XfLoad);
