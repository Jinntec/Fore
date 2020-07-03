import { XfAction } from "../actions/xf-action.js";

/**
 * `xf-update`
 *
 * force an update of the whole form. Changed modelData will be sent to server and response will be applied
 * back to dataModel.
 *
 *
 * @customElement
 * @polymer
 * @demo demo/helloworld.html
 */
class XfUpdate extends XfAction {

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
        super.execute();
        // this.ownerForm.update();

        // just for testing
        this.ownerForm._handleUpdate();
    }


}

window.customElements.define('xf-update', XfUpdate);
