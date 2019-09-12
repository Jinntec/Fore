import { XfAction } from "./xf-action.js";


/**
 * `xf-return`
 * general class for bound elements
 *
 * todo: implementation and demo
 *
 * @customElement
 * @polymer
 */
class XfReturn extends XfAction {

    static get properties() {
        return {
        };
    }

    execute(){
        super.execute();
        console.log('##### xf-return executing bindId ', this.bind);


    }


}

window.customElements.define('xf-return', XfReturn);
