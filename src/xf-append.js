import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import { XfAbstractAction } from "./xf-abstract-action.js";

/**
 * `xf-append`
 * appends an entry to a `xf-repeat`.
 *
 * @customElement
 * @polymer
 * @demo demo/todo.html
 * @demo demo/todoWithLabels.html
 */
class XfAppend extends XfAbstractAction {

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

        const repeated = this.closest('xf-repeat-item');
        // const repeated = this.closest('xf-repeat');
        console.log('### repeated append ', repeated);
        // console.log('repeated append index', repeated.index);

        // ### find target repeat for this action
        let targetItem;
        if (repeated){
            targetItem = repeated.querySelector('[id=' + this.repeat + ']');
        }else{
            targetItem = document.getElementById(this.repeat);
        }

        targetItem.appendRepeatItem();
    }


}

window.customElements.define('xf-append', XfAppend);
