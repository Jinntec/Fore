import {XfAction} from "./xf-action.js";

/**
 * `xf-delete`
 * general class for bound elements
 *
 * @customElement
 * @demo demo/todo.html
 */
class XfDelete extends XfAction {

    static get properties() {
        return {
            bind: {
                type: String
            }
        };
    }


    execute() {
        super.execute();
        console.log('##### xf-delete executing...');

        console.log('delete nodeset ', this.nodeset);
        const parent = this.nodeset.parentNode;
        console.log('delete parent ', parent);

        parent.removeChild(this.nodeset);
        console.log('parent after removal', parent);


        this.doRebuild(true);
        this.doRecalculate(true);
        this.doRevalidate(true);
        this.doRefresh(true);
        this.actionPerformed();

    }

}

window.customElements.define('xf-delete', XfDelete);
