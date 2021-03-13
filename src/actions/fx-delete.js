import {FxAction} from "./fx-action.js";
// import * as fx from "fontoxpath";
import {Fore} from "../fore.js";

/**
 * `fx-delete`
 * general class for bound elements
 *
 * @customElement
 * @demo demo/todo.html
 */
class FxDelete extends FxAction {

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
        console.log('##### fx-delete executing...');

        this.ref = this.getAttribute('ref');
        // const inscope = this._inScopeContext();
        // this.nodeset = fx.evaluateXPathToNodes(this.ref, inscope, null, {});


        console.log('delete nodeset ', this.nodeset);

        // ### if there's no repeat we are inside of a repeat template
        if(this.repeat === ''){

            // find the index to delete
            const rItem = this.parentNode.closest('fx-repeatitem');
            const idx = rItem.index;

            const repeatElement = this.parentNode.closest('fx-repeat');

            // todo: find a better solution for the empty repeat problem - this just empties the values of the last item.
            // if(repeatElement.nodeset.length === 1 && idx === 1){
            if(repeatElement.nodeset.length === 1){
                // ### do not delete last entry but empty its values
                const mItem = this.getModel().getModelItem(this.nodeset[0])
                Fore.clear(mItem.node);
            }else{
                const nodeToDelete = this.nodeset[idx-1];
                const p = nodeToDelete.parentNode;
                p.removeChild(nodeToDelete);

                //remove the repeatitem
                rItem.parentNode.removeChild(rItem);
            }

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

window.customElements.define('fx-delete', FxDelete);
