import {XfAction} from './xf-action.js';

import "../xf-model.js";

/**
 * `xf-setvalue`
 *
 * @customElement
 * @polymer
 */
export default class XfSetvalue extends XfAction {

    static get properties() {
        return {
            ...super.properties,
            value: {
                type: String
            }
        };
    }

    constructor(){
        super();
    }

    execute() {
        super.execute();

        const modelItem = this.getModelItem();
        this.setValue(modelItem,this.value);


        /*
                const repeated = this.closest('xf-repeat-item');

                const path = this.ownerForm.resolveBinding(this);
                console.log('### xf-setvalue path ', path);


                if(repeated){
                    const item = repeated.modelItem;
                    const target = this.ownerForm.findById(item,this.bind);
                    target.value = this.value;
                    this.dispatchEvent(new CustomEvent('value-changed', {
                        composed: true,
                        bubbles: true,
                        detail: {'modelItem': target,"path":path,"target":this}
                    }));

                }else{
                    this.modelItem.value = this.value;
                    this.dispatchEvent(new CustomEvent('value-changed', {
                        composed: true,
                        bubbles: true,
                        detail: {'modelItem': this.modelItem,"path":path,"target":this}
                    }));
                }
        */

        // super.execute();
    }

    setValue(modelItem, newVal){
        console.log('setvalue  ', modelItem, newVal);

        if(modelItem.value !== newVal){
            modelItem.value = newVal;

            this.needsRebuild = true;
            this.needsRecalculate = true;
            this.needsRevalidate = true;
            this.needsRefresh = true;
            this.actionPerformed();
        }

    }

}

window.customElements.define('xf-setvalue', XfSetvalue);
