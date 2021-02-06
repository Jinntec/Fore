import {XfAction} from "./xf-action.js";
import * as fx from "fontoxpath";

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
            ...super.properties,
            repeat:{
                type: String
            }
        };
    }

    constructor() {
        super();
        this.repeat = '';
    }


    execute() {
        super.execute();
        console.log('##### xf-delete executing...');

        this.ref = this.getAttribute('ref');
        // const inscope = this._inScopeContext();
        // this.nodeset = fx.evaluateXPathToNodes(this.ref, inscope, null, {});


        console.log('delete nodeset ', this.nodeset);

        // ### if there's no repeat we are inside of a repeat template
        if(this.repeat === ''){

            // find the index to delete
            const rItem = this.parentNode.closest('xf-repeatitem');
            const idx = rItem.index;

            const nodeToDelete = this.nodeset;
            const p = nodeToDelete.parentNode;
            p.removeChild(nodeToDelete);
            // this.nodeset[idx]
        }


/*
        const parent = this.nodeset.parentNode;
        console.log('delete parent ', parent);

        parent.removeChild(this.nodeset);
        console.log('parent after removal', parent);
*/


        this.needsRebuild=true;
        this.needsRecalculate=true;
        this.needsRevalidate=true;
        this.needsRefresh=true;
        this.actionPerformed();

    }

}

window.customElements.define('xf-delete', XfDelete);
