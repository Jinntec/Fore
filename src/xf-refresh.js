import { XfAction } from "./xf-action.js";


/**
 * `xf-refresh`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class XfRefresh extends XfAction {


    execute(){
        // console.log('#### refresh fired');
        this.closest('xf-form').refresh();
    }


}

window.customElements.define('xf-refresh', XfRefresh);
