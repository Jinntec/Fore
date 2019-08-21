import { XfAction } from "./xf-action.js";

/**
 * `xf-insert`
 * general class for bound elements
 *
 * todo: implementation and demo
 *
 * @customElement
 * @polymer
 */
class XfInsert extends XfAction {

    static get properties() {
        return {
            bind: {
                type: String
            },
            repeat:{
                type: String
            },
            /**
             * determines where new item is inserted. Valid values are 'before' or 'after'. Any other value will
             * be ignored and defaulted to 'after'.
             */
            position:{
                type: String,
                value:'after'
            }
        };
    }

    execute(){
        console.log('##### xf-insert executing bindId ', this.bind);
        super.execute();

        // const repeated = this.closest('xf-repeat-item');
        const repeated = this.closest('xf-repeat');
        console.log('### repeated append ', repeated);
        // console.log('repeated append index', repeated.index);

        // ### find target repeat for this action
        let targetItem;
        if (repeated){
            // if the repeat itself is repeated we need to search in current subtree of the repeat-item
            targetItem = repeated.querySelector('[id=' + this.repeat + ']');
        }else{
            targetItem = document.getElementById(this.repeat);
        }

        targetItem.insertRepeatItem(this.position);
    }


}

window.customElements.define('xf-insert', XfInsert);
